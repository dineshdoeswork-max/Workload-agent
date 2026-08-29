// ─────────────────────────────────────────────────────────────
// Configurable Constants
// All tunable thresholds and weights in one place.
// Change these to adjust sensitivity — no magic numbers elsewhere.
// ─────────────────────────────────────────────────────────────

import type { Priority } from "./models/types.js";

// ── Load Classification Thresholds ──
// These define the load_ratio boundaries for each bucket.
// load_ratio = currentAllocatedHours / weeklyCapacityHours

/** Below this ratio → Underloaded (available for more work) */
export const UNDERLOADED_THRESHOLD = 0.7;

/** At or above this ratio → Overloaded (at risk of burnout/delays) */
export const OVERLOADED_THRESHOLD = 1.0;

/** At or above this ratio → Critical (immediate redistribution needed) */
export const CRITICAL_THRESHOLD = 1.3;

/** A person with 0 active hours is classified as Idle, not just Underloaded */
export const IDLE_THRESHOLD = 0.0;

// ── Priority Weights ──
// Used to compute a priority-weighted load ratio so that a person
// carrying 20h of P0 work is flagged more urgently than someone
// carrying 20h of P3 work.

export const PRIORITY_WEIGHTS: Record<Priority, number> = {
  P0: 4,
  P1: 3,
  P2: 2,
  P3: 1,
};

// ── Time Constants ──

/** Standard working hours per day */
export const WORKING_HOURS_PER_DAY = 8;

/** Standard working days per week */
export const WORKING_DAYS_PER_WEEK = 5;

// ── Risk Detection ──

/**
 * Number of days a task can remain in `in_progress` or `blocked` status
 * without an `updatedAt` change before it's flagged as stale.
 */
export const STALENESS_THRESHOLD_DAYS = 7;

/**
 * Deadline-feasibility severity thresholds.
 * Based on the ratio: remainingEffort / availableHours
 * - > HIGH_RISK_RATIO → High severity
 * - > MEDIUM_RISK_RATIO → Medium severity
 * - anything flagged but below medium → Low severity
 */
export const HIGH_RISK_RATIO = 1.5;
export const MEDIUM_RISK_RATIO = 1.2;

// ── Redistribution ──

/**
 * Maximum number of redistribution suggestions to generate per analysis run.
 * Keeps output actionable rather than overwhelming.
 */
export const MAX_REDISTRIBUTION_SUGGESTIONS = 10;

/**
 * Minimum skill overlap score (0–1) to consider a candidate for reassignment.
 * Set to 0 to allow any reassignment regardless of skills.
 * Set higher to enforce stricter skill matching.
 */
export const MIN_SKILL_MATCH_SCORE = 0.0;

// ── Team Summary ──

/** Number of top recommended actions to include in the team summary */
export const TOP_ACTIONS_COUNT = 3;
