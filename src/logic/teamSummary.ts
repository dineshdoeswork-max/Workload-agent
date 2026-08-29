// ─────────────────────────────────────────────────────────────
// Team Summary
// Produces the rollup view: total capacity vs. allocated,
// bucket counts, idle pool, risk counts, and top actions.
// ─────────────────────────────────────────────────────────────

import type {
  PersonWorkloadScore,
  DeliveryRisk,
  IdleCapacity,
  RedistributionSuggestion,
  TeamSummary,
  LoadBucket,
  RiskSeverity,
} from "../models/types.js";
import { TOP_ACTIONS_COUNT } from "../config.js";

/**
 * Build the team-level summary from pre-computed analysis data.
 */
export function buildTeamSummary(
  scores: PersonWorkloadScore[],
  risks: DeliveryRisk[],
  idlePool: IdleCapacity[],
  suggestions: RedistributionSuggestion[]
): TeamSummary {
  // ── Capacity vs. Allocated ──
  const totalCapacityHours = scores.reduce(
    (sum, s) => sum + s.weeklyCapacityHours,
    0
  );
  const totalAllocatedHours = scores.reduce(
    (sum, s) => sum + s.currentAllocatedHours,
    0
  );
  const utilizationPercent =
    totalCapacityHours > 0
      ? Math.round((totalAllocatedHours / totalCapacityHours) * 100)
      : 0;

  // ── Bucket Counts ──
  const bucketCounts: Record<LoadBucket, number> = {
    Idle: 0,
    Underloaded: 0,
    Balanced: 0,
    Overloaded: 0,
    Critical: 0,
  };
  for (const score of scores) {
    bucketCounts[score.bucket]++;
  }

  // ── Idle Pool Summary ──
  const idlePoolSummary = idlePool.map((p) => ({
    memberId: p.memberId,
    memberName: p.memberName,
    freeHours: p.freeHours,
  }));

  // ── Risk Counts ──
  // Deduplicate risks by taskId to avoid counting the same task multiple times
  const uniqueRiskTasks = new Map<string, RiskSeverity>();
  for (const risk of risks) {
    const existing = uniqueRiskTasks.get(risk.taskId);
    // Keep the highest severity for each task
    if (
      !existing ||
      severityRank(risk.severity) < severityRank(existing)
    ) {
      uniqueRiskTasks.set(risk.taskId, risk.severity);
    }
  }
  const riskCountsBySeverity: Record<RiskSeverity, number> = {
    Low: 0,
    Medium: 0,
    High: 0,
  };
  for (const severity of uniqueRiskTasks.values()) {
    riskCountsBySeverity[severity]++;
  }

  // ── Top Recommended Actions ──
  const topRecommendedActions = generateTopActions(
    scores,
    risks,
    suggestions,
    idlePool
  );

  return {
    totalCapacityHours,
    totalAllocatedHours,
    utilizationPercent,
    bucketCounts,
    idlePool: idlePoolSummary,
    riskCountsBySeverity,
    topRecommendedActions,
  };
}

function severityRank(s: RiskSeverity): number {
  return s === "High" ? 0 : s === "Medium" ? 1 : 2;
}

/**
 * Generate the top N recommended actions for this week.
 * Derived from the most impactful redistribution suggestions
 * and the most urgent risks.
 */
function generateTopActions(
  scores: PersonWorkloadScore[],
  risks: DeliveryRisk[],
  suggestions: RedistributionSuggestion[],
  idlePool: IdleCapacity[]
): string[] {
  const actions: string[] = [];

  // Action 1: Address the highest-severity redistribution suggestion
  if (suggestions.length > 0) {
    const top = suggestions[0];
    actions.push(
      `Reassign "${top.taskTitle}" (${top.effortHours}h) from ${top.fromMemberName} to ${top.toMemberName} — ${top.toMemberName} has capacity and matching skills`
    );
  }

  // Action 2: Address stale/blocked tasks
  const staleRisks = risks.filter((r) => r.riskType === "staleness");
  if (staleRisks.length > 0) {
    const stale = staleRisks[0];
    actions.push(
      `Unblock "${stale.taskTitle}" assigned to ${stale.memberName} — it has been stale for days and is approaching its ${stale.deadline} deadline`
    );
  }

  // Action 3: Highlight critical overloads
  const criticalPeople = scores.filter((s) => s.bucket === "Critical");
  if (criticalPeople.length > 0) {
    const names = criticalPeople.map((p) => p.memberName).join(", ");
    actions.push(
      `Review workload for ${names} — currently in Critical status with load exceeding capacity by significant margin`
    );
  }

  // Action 4: Utilize idle capacity
  if (idlePool.length > 0 && actions.length < TOP_ACTIONS_COUNT) {
    const names = idlePool.map((p) => `${p.memberName} (${p.freeHours}h free)`).join(", ");
    actions.push(
      `Leverage available capacity: ${names} — consider assigning upcoming sprint work or pulling forward backlog items`
    );
  }

  // Additional suggestions if we still need more
  for (let i = 1; i < suggestions.length && actions.length < TOP_ACTIONS_COUNT; i++) {
    const s = suggestions[i];
    actions.push(
      `Consider moving "${s.taskTitle}" (${s.effortHours}h) from ${s.fromMemberName} to ${s.toMemberName}`
    );
  }

  return actions.slice(0, TOP_ACTIONS_COUNT);
}
