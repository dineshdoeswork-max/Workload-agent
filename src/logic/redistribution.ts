// ─────────────────────────────────────────────────────────────
// Redistribution Suggestions
//
// Triggered when someone is Overloaded/Critical OR flagged
// at-risk under deadline-feasibility, and produces concrete
// "move task X from person A to person B" suggestions.
//
// Candidate selection:
//   1. Identify movable tasks (not_started, not highest-priority)
//   2. Scan idle/available pool for skill match + capacity
//   3. Rank by: skill overlap > free hours > least disruption
//
// Each suggestion includes before/after status for both people.
// ─────────────────────────────────────────────────────────────

import type {
  Task,
  TeamMember,
  PersonWorkloadScore,
  IdleCapacity,
  DeliveryRisk,
  RedistributionSuggestion,
  LoadBucket,
} from "../models/types.js";
import { MAX_REDISTRIBUTION_SUGGESTIONS, MIN_SKILL_MATCH_SCORE } from "../config.js";
import { classifyLoadRatio } from "./workloadScoring.js";
import { computeAvailableHours } from "./riskDetection.js";
import { getTeamMemberById } from "../data/store.js";

// ── Helpers ──

/**
 * Compute skill overlap between a task's project skills and a candidate's skills.
 * Returns a score 0–1 (1 = perfect match, 0 = no overlap).
 * If the candidate has no skills listed, returns 0.5 (neutral — don't penalize empty data).
 */
function skillMatchScore(
  candidateSkills: string[],
  requiredSkills: string[]
): number {
  if (requiredSkills.length === 0) return 1; // no requirements = anyone qualifies
  if (candidateSkills.length === 0) return 0.5; // no data = neutral

  const overlap = candidateSkills.filter((s) =>
    requiredSkills.includes(s)
  ).length;
  return overlap / requiredSkills.length;
}

/**
 * Get the skill tags that are relevant for a task.
 * Uses the assignee's skills as a proxy for "what skills this task needs."
 */
function getRequiredSkillsForTask(
  task: Task,
  fromMember: TeamMember
): string[] {
  return fromMember.skills;
}

/**
 * Identify movable tasks for an overloaded/at-risk person.
 * Movable = not_started, not blocked, and preferably lower priority.
 * Sorted by priority (lowest first) so we suggest moving the
 * least risky tasks first.
 */
function findMovableTasks(activeTasks: Task[]): Task[] {
  const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };

  return activeTasks
    .filter((t) => t.status === "not_started")
    .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]); // lowest priority first
}

// ── Main Logic ──

/**
 * Generate redistribution suggestions.
 *
 * @param scores      - Pre-computed workload scores for all team members
 * @param risks       - Pre-computed delivery risks
 * @param idlePool    - Pre-computed idle/available capacity pool
 * @param today       - Reference date for capacity calculations
 */
export function generateRedistributionSuggestions(
  scores: PersonWorkloadScore[],
  risks: DeliveryRisk[],
  idlePool: IdleCapacity[],
  today: Date = new Date()
): RedistributionSuggestion[] {
  const suggestions: RedistributionSuggestion[] = [];

  if (idlePool.length === 0) return suggestions; // nobody to redistribute to

  // Track how much extra effort each idle person has been "given"
  // in this batch of suggestions, so we don't overload them
  const additionalEffort = new Map<string, number>();

  // Find people who need relief: Overloaded, Critical, or at-risk
  const atRiskMemberIds = new Set(
    risks
      .filter((r) => r.riskType === "deadline_feasibility")
      .map((r) => r.memberId)
  );

  const needsRelief = scores.filter(
    (s) =>
      s.bucket === "Overloaded" ||
      s.bucket === "Critical" ||
      atRiskMemberIds.has(s.memberId)
  );

  // Sort: Critical first, then Overloaded, then at-risk-only
  const bucketOrder: Record<LoadBucket, number> = {
    Critical: 0,
    Overloaded: 1,
    Balanced: 2,
    Underloaded: 3,
    Idle: 4,
  };
  needsRelief.sort((a, b) => bucketOrder[a.bucket] - bucketOrder[b.bucket]);

  for (const person of needsRelief) {
    if (suggestions.length >= MAX_REDISTRIBUTION_SUGGESTIONS) break;

    const fromMember = getTeamMemberById(person.memberId);
    if (!fromMember) continue;

    const movableTasks = findMovableTasks(person.activeTasks);
    if (movableTasks.length === 0) continue;

    for (const task of movableTasks) {
      if (suggestions.length >= MAX_REDISTRIBUTION_SUGGESTIONS) break;

      const requiredSkills = getRequiredSkillsForTask(task, fromMember);
      const taskDeadline = new Date(task.deadline);

      // Score and rank candidates from the idle pool
      const candidateScores: {
        candidate: IdleCapacity;
        skillScore: number;
        effectiveFreeHours: number;
      }[] = [];

      for (const candidate of idlePool) {
        // Don't suggest reassigning to the same person
        if (candidate.memberId === person.memberId) continue;

        const extraEffort = additionalEffort.get(candidate.memberId) ?? 0;
        const effectiveFreeHours = candidate.freeHours - extraEffort;

        // Can they absorb this task without going negative?
        if (effectiveFreeHours < task.estimatedEffort) continue;

        // Check they won't become at-risk for this task's deadline
        const candidateMember = getTeamMemberById(candidate.memberId);
        if (candidateMember) {
          const availableUntilDeadline = computeAvailableHours(
            candidateMember,
            today,
            taskDeadline
          );
          const currentLoad = candidate.currentAllocatedHours + extraEffort;
          if (currentLoad + task.estimatedEffort > availableUntilDeadline) {
            continue; // absorbing this would put them at deadline risk
          }
        }

        const skillScore = skillMatchScore(candidate.skills, requiredSkills);
        if (skillScore < MIN_SKILL_MATCH_SCORE) continue;

        candidateScores.push({
          candidate,
          skillScore,
          effectiveFreeHours,
        });
      }

      // Rank: best skill match first, then most remaining free hours
      candidateScores.sort((a, b) => {
        const skillDiff = b.skillScore - a.skillScore;
        if (Math.abs(skillDiff) > 0.01) return skillDiff;
        return b.effectiveFreeHours - a.effectiveFreeHours;
      });

      const best = candidateScores[0];
      if (!best) continue;

      // Compute before/after statuses
      const fromLoadBefore = person.bucket;
      const fromNewAllocated = person.currentAllocatedHours - task.estimatedEffort;
      const fromNewRatio =
        person.weeklyCapacityHours > 0
          ? fromNewAllocated / person.weeklyCapacityHours
          : 0;
      const fromLoadAfter = classifyLoadRatio(fromNewRatio);

      const toLoadBefore = best.candidate.bucket;
      const extraBefore = additionalEffort.get(best.candidate.memberId) ?? 0;
      const toNewAllocated =
        best.candidate.currentAllocatedHours + extraBefore + task.estimatedEffort;
      const toNewRatio =
        best.candidate.weeklyCapacityHours > 0
          ? toNewAllocated / best.candidate.weeklyCapacityHours
          : 0;
      const toLoadAfter = classifyLoadRatio(toNewRatio);

      // Build rationale
      const freeHoursNote = Math.round(best.effectiveFreeHours);
      const skillNote =
        best.skillScore >= 0.8
          ? "strong skill match"
          : best.skillScore >= 0.5
            ? "partial skill match"
            : "limited skill match";

      suggestions.push({
        taskId: task.id,
        taskTitle: task.title,
        effortHours: task.estimatedEffort,
        fromMemberId: person.memberId,
        fromMemberName: person.memberName,
        toMemberId: best.candidate.memberId,
        toMemberName: best.candidate.memberName,
        rationale: `${best.candidate.memberName} has ${freeHoursNote}h free before ${task.deadline} deadline (${skillNote}). Moving "${task.title}" (${task.estimatedEffort}h, ${task.priority}) from ${person.memberName} (${fromLoadBefore} → ${fromLoadAfter}) reduces their overload`,
        fromStatusBefore: fromLoadBefore,
        fromStatusAfter: fromLoadAfter,
        toStatusBefore: toLoadBefore,
        toStatusAfter: toLoadAfter,
      });

      // Track the extra effort assigned to this candidate
      additionalEffort.set(
        best.candidate.memberId,
        (additionalEffort.get(best.candidate.memberId) ?? 0) + task.estimatedEffort
      );
    }
  }

  return suggestions;
}
