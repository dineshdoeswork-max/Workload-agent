// ─────────────────────────────────────────────────────────────
// Workload Scoring
// Computes per-person load ratio and classifies into buckets.
//
// Formula:
//   loadRatio = currentAllocatedHours / weeklyCapacityHours
//
// Priority-weighted variant:
//   weightedLoadRatio = Σ(effort_i × weight_i) / (capacity × avgWeight)
//   where avgWeight = Σ(weight_i) / N across all active tasks
//
// Classification:
//   loadRatio == 0           → Idle
//   loadRatio < 0.7          → Underloaded
//   0.7 ≤ loadRatio < 1.0   → Balanced
//   1.0 ≤ loadRatio < 1.3   → Overloaded
//   loadRatio ≥ 1.3          → Critical
// ─────────────────────────────────────────────────────────────

import type { TeamMember, Task, PersonWorkloadScore, LoadBucket } from "../models/types.js";
import {
  IDLE_THRESHOLD,
  UNDERLOADED_THRESHOLD,
  OVERLOADED_THRESHOLD,
  CRITICAL_THRESHOLD,
  PRIORITY_WEIGHTS,
} from "../config.js";
import { getAllTeamMembers, getActiveTasksByAssignee } from "../data/store.js";

/**
 * Classify a load ratio into a LoadBucket.
 * Exported so other modules can re-classify after hypothetical reassignments.
 */
export function classifyLoadRatio(ratio: number): LoadBucket {
  if (ratio <= IDLE_THRESHOLD) return "Idle";
  if (ratio < UNDERLOADED_THRESHOLD) return "Underloaded";
  if (ratio < OVERLOADED_THRESHOLD) return "Balanced";
  if (ratio < CRITICAL_THRESHOLD) return "Overloaded";
  return "Critical";
}

/**
 * Compute the priority-weighted load ratio.
 * A person with 20h of P0 work scores higher than one with 20h of P3 work.
 */
function computeWeightedLoadRatio(
  activeTasks: Task[],
  weeklyCapacityHours: number
): number {
  if (activeTasks.length === 0 || weeklyCapacityHours === 0) return 0;

  const weightedEffort = activeTasks.reduce(
    (sum, task) => sum + task.estimatedEffort * PRIORITY_WEIGHTS[task.priority],
    0
  );

  const totalWeight = activeTasks.reduce(
    (sum, task) => sum + PRIORITY_WEIGHTS[task.priority],
    0
  );

  const avgWeight = totalWeight / activeTasks.length;

  // Normalize: divide by (capacity × avgWeight) so the ratio stays
  // comparable to the unweighted version in magnitude
  return weightedEffort / (weeklyCapacityHours * avgWeight);
}

/**
 * Score a single team member's workload.
 */
export function scoreTeamMember(member: TeamMember): PersonWorkloadScore {
  const activeTasks = getActiveTasksByAssignee(member.id);
  const currentAllocatedHours = activeTasks.reduce(
    (sum, t) => sum + t.estimatedEffort,
    0
  );
  const loadRatio =
    member.weeklyCapacityHours > 0
      ? currentAllocatedHours / member.weeklyCapacityHours
      : currentAllocatedHours > 0
        ? Infinity
        : 0;

  const weightedLoadRatio = computeWeightedLoadRatio(
    activeTasks,
    member.weeklyCapacityHours
  );

  const bucket = classifyLoadRatio(loadRatio);

  return {
    memberId: member.id,
    memberName: member.name,
    role: member.role,
    weeklyCapacityHours: member.weeklyCapacityHours,
    currentAllocatedHours,
    loadRatio: Math.round(loadRatio * 100) / 100,
    weightedLoadRatio: Math.round(weightedLoadRatio * 100) / 100,
    bucket,
    activeTasks,
  };
}

/**
 * Score all team members.
 */
export function computeAllWorkloadScores(): PersonWorkloadScore[] {
  return getAllTeamMembers().map(scoreTeamMember);
}
