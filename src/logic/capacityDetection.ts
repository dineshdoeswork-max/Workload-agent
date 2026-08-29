// ─────────────────────────────────────────────────────────────
// Idle / Available Capacity Detection
// Proactively surfaces everyone who is Underloaded or Idle
// on every analysis run, not just reactively when someone
// else is overloaded.
//
// This is the pool that redistribution pulls candidates from.
// ─────────────────────────────────────────────────────────────

import type { PersonWorkloadScore, IdleCapacity } from "../models/types.js";

/**
 * Extract the idle/available pool from pre-computed workload scores.
 * A person is in the pool if their bucket is Idle or Underloaded.
 */
export function detectIdleCapacity(
  scores: PersonWorkloadScore[]
): IdleCapacity[] {
  return scores
    .filter((s) => s.bucket === "Idle" || s.bucket === "Underloaded")
    .map((s) => ({
      memberId: s.memberId,
      memberName: s.memberName,
      role: s.role,
      skills: [], // filled in below
      weeklyCapacityHours: s.weeklyCapacityHours,
      currentAllocatedHours: s.currentAllocatedHours,
      freeHours: s.weeklyCapacityHours - s.currentAllocatedHours,
      loadRatio: s.loadRatio,
      bucket: s.bucket,
    }))
    .sort((a, b) => b.freeHours - a.freeHours); // most free hours first
}

/**
 * Same as above, but enriches with skills from team member data.
 * Call this from the orchestrator after scores are computed.
 */
export function detectIdleCapacityWithSkills(
  scores: PersonWorkloadScore[],
  memberSkills: Map<string, string[]>
): IdleCapacity[] {
  const pool = detectIdleCapacity(scores);
  for (const entry of pool) {
    entry.skills = memberSkills.get(entry.memberId) ?? [];
  }
  return pool;
}
