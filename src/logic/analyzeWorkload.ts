// ─────────────────────────────────────────────────────────────
// Analysis Orchestrator
// Calls all 5 analysis modules in order and returns a single
// AnalysisResult JSON that a UI can bind to directly.
// ─────────────────────────────────────────────────────────────

import type { AnalysisResult } from "../models/types.js";
import { getAllTeamMembers } from "../data/store.js";
import { computeAllWorkloadScores } from "./workloadScoring.js";
import { detectAllRisks } from "./riskDetection.js";
import { detectIdleCapacityWithSkills } from "./capacityDetection.js";
import { generateRedistributionSuggestions } from "./redistribution.js";
import { buildTeamSummary } from "./teamSummary.js";

/**
 * Run the full workload analysis.
 *
 * This is the single entry point the API exposes.
 * All downstream modules operate on the current in-memory data state,
 * so calling this after any CRUD operation gives an up-to-date picture.
 *
 * @param referenceDate - Override "today" for testing. Defaults to Date.now().
 * @returns Complete AnalysisResult with scores, risks, idle pool,
 *          redistribution suggestions, and team summary.
 */
export function analyzeWorkload(
  referenceDate?: Date
): AnalysisResult {
  const today = referenceDate ?? new Date();

  // Step 1: Score every team member's workload
  const workloadScores = computeAllWorkloadScores();

  // Step 2: Detect delivery risks (deadline feasibility, dependencies, staleness)
  const deliveryRisks = detectAllRisks(today);

  // Step 3: Identify idle / available capacity (enriched with skills)
  const memberSkills = new Map(
    getAllTeamMembers().map((m) => [m.id, m.skills])
  );
  const idleCapacity = detectIdleCapacityWithSkills(workloadScores, memberSkills);

  // Step 4: Generate redistribution suggestions
  const redistributionSuggestions = generateRedistributionSuggestions(
    workloadScores,
    deliveryRisks,
    idleCapacity,
    today
  );

  // Step 5: Build team-level summary
  const teamSummary = buildTeamSummary(
    workloadScores,
    deliveryRisks,
    idleCapacity,
    redistributionSuggestions
  );

  return {
    timestamp: new Date().toISOString(),
    currentDate: today.toISOString().split("T")[0],
    workloadScores,
    deliveryRisks,
    idleCapacity,
    redistributionSuggestions,
    teamSummary,
  };
}
