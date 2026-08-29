// ─────────────────────────────────────────────────────────────
// Delivery Risk Detection
// Identifies tasks/people at risk of missing deadlines.
//
// Three independent risk checks:
//
// 1. Deadline feasibility
//    For each person, for each deadline among their active tasks:
//      availableHours = businessDaysUntilDeadline × dailyCapacity
//      remainingEffort = Σ estimatedEffort for active tasks due ≤ deadline
//      If remainingEffort > availableHours → at-risk
//
// 2. Dependency risk
//    Task has unresolved dependencies that are late or not done
//
// 3. Staleness
//    Task is in_progress or blocked and updatedAt is older than
//    STALENESS_THRESHOLD_DAYS
// ─────────────────────────────────────────────────────────────

import type { TeamMember, Task, DeliveryRisk, DateRange } from "../models/types.js";
import {
  STALENESS_THRESHOLD_DAYS,
  WORKING_HOURS_PER_DAY,
  WORKING_DAYS_PER_WEEK,
  HIGH_RISK_RATIO,
  MEDIUM_RISK_RATIO,
} from "../config.js";
import { getAllTeamMembers, getActiveTasksByAssignee, getTaskById } from "../data/store.js";

// ── Date Helpers ──

/**
 * Count business days (Mon–Fri) between two dates, inclusive of start,
 * exclusive of end. Returns 0 if deadline is today or past.
 */
function countBusinessDays(from: Date, to: Date): number {
  let count = 0;
  const current = new Date(from);
  current.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);

  while (current < end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Count business days that fall within any timeOff range.
 */
function countTimeOffDays(
  from: Date,
  to: Date,
  timeOff: DateRange[]
): number {
  let count = 0;
  const current = new Date(from);
  current.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);

  while (current < end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      for (const range of timeOff) {
        const offStart = new Date(range.start);
        const offEnd = new Date(range.end);
        offStart.setHours(0, 0, 0, 0);
        offEnd.setHours(0, 0, 0, 0);
        if (current >= offStart && current <= offEnd) {
          count++;
          break;
        }
      }
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Compute available working hours between now and a deadline for a person,
 * accounting for weekends and time off.
 */
export function computeAvailableHours(
  member: TeamMember,
  today: Date,
  deadline: Date
): number {
  const bizDays = countBusinessDays(today, deadline);
  const offDays = countTimeOffDays(today, deadline, member.timeOff);
  const workingDays = Math.max(0, bizDays - offDays);
  const dailyCapacity = member.weeklyCapacityHours / WORKING_DAYS_PER_WEEK;
  return workingDays * dailyCapacity;
}

/**
 * Compute days since a given ISO date string.
 */
function daysSince(isoDate: string, today: Date): number {
  const then = new Date(isoDate);
  const diff = today.getTime() - then.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ── Risk Checks ──

/**
 * Check deadline feasibility for a team member.
 * Groups tasks by deadline and checks if remaining effort fits.
 */
function checkDeadlineFeasibility(
  member: TeamMember,
  activeTasks: Task[],
  today: Date
): DeliveryRisk[] {
  const risks: DeliveryRisk[] = [];

  // Collect unique deadlines
  const deadlines = [...new Set(activeTasks.map((t) => t.deadline))].sort();

  for (const deadline of deadlines) {
    const deadlineDate = new Date(deadline);

    // Skip deadlines already passed — those are a different kind of problem
    if (deadlineDate <= today) continue;

    // Sum effort of all active tasks due on or before this deadline
    const tasksDueByDeadline = activeTasks.filter(
      (t) => new Date(t.deadline) <= deadlineDate
    );
    const remainingEffort = tasksDueByDeadline.reduce(
      (sum, t) => sum + t.estimatedEffort,
      0
    );

    const availableHours = computeAvailableHours(member, today, deadlineDate);

    if (remainingEffort > availableHours) {
      const ratio = availableHours > 0 ? remainingEffort / availableHours : Infinity;
      const severity =
        ratio >= HIGH_RISK_RATIO ? "High" : ratio >= MEDIUM_RISK_RATIO ? "Medium" : "Low";

      // Flag each individual task that contributes to this deadline crunch
      for (const task of tasksDueByDeadline) {
        // Avoid duplicate flags if a task appears under multiple deadline groups
        if (risks.some((r) => r.taskId === task.id && r.riskType === "deadline_feasibility")) {
          continue;
        }

        risks.push({
          taskId: task.id,
          taskTitle: task.title,
          projectId: task.projectId,
          memberId: member.id,
          memberName: member.name,
          riskType: "deadline_feasibility",
          severity,
          deadline,
          remainingEffort,
          availableHours: Math.round(availableHours * 10) / 10,
          reason: `${member.name} has ${remainingEffort}h of work remaining but only ${Math.round(availableHours)}h available before the ${deadline} deadline`,
        });
      }
    }
  }

  return risks;
}

/**
 * Check for dependency risks: task depends on another task that isn't done
 * and is itself past its deadline.
 */
function checkDependencyRisks(
  activeTasks: Task[],
  member: TeamMember,
  today: Date
): DeliveryRisk[] {
  const risks: DeliveryRisk[] = [];

  for (const task of activeTasks) {
    if (task.dependencies.length === 0) continue;

    for (const depId of task.dependencies) {
      const depTask = getTaskById(depId);
      if (!depTask) continue;

      // Dependency is not done and its deadline has passed
      if (depTask.status !== "done" && new Date(depTask.deadline) < today) {
        risks.push({
          taskId: task.id,
          taskTitle: task.title,
          projectId: task.projectId,
          memberId: member.id,
          memberName: member.name,
          riskType: "dependency",
          severity: "Medium",
          deadline: task.deadline,
          reason: `"${task.title}" depends on "${depTask.title}" (${depTask.id}) which is not done and past its deadline of ${depTask.deadline}`,
        });
      }

      // Dependency is blocked or in_progress and stale
      if (
        depTask.status !== "done" &&
        (depTask.status === "blocked" || depTask.status === "in_progress") &&
        daysSince(depTask.updatedAt, today) > STALENESS_THRESHOLD_DAYS
      ) {
        risks.push({
          taskId: task.id,
          taskTitle: task.title,
          projectId: task.projectId,
          memberId: member.id,
          memberName: member.name,
          riskType: "dependency",
          severity: "Medium",
          deadline: task.deadline,
          reason: `"${task.title}" depends on "${depTask.title}" (${depTask.id}) which has been ${depTask.status} for ${daysSince(depTask.updatedAt, today)} days without updates`,
        });
      }
    }
  }

  return risks;
}

/**
 * Check for stale tasks: in_progress or blocked with no updatedAt change
 * beyond the staleness threshold.
 */
function checkStaleness(
  activeTasks: Task[],
  member: TeamMember,
  today: Date
): DeliveryRisk[] {
  const risks: DeliveryRisk[] = [];

  for (const task of activeTasks) {
    if (task.status !== "in_progress" && task.status !== "blocked") continue;

    const staleForDays = daysSince(task.updatedAt, today);
    if (staleForDays > STALENESS_THRESHOLD_DAYS) {
      const severity = staleForDays > STALENESS_THRESHOLD_DAYS * 2 ? "High" : "Medium";

      risks.push({
        taskId: task.id,
        taskTitle: task.title,
        projectId: task.projectId,
        memberId: member.id,
        memberName: member.name,
        riskType: "staleness",
        severity,
        deadline: task.deadline,
        reason: `"${task.title}" has been ${task.status} for ${staleForDays} days without any update (threshold: ${STALENESS_THRESHOLD_DAYS} days)`,
      });
    }
  }

  return risks;
}

// ── Public API ──

/**
 * Run all risk checks across all team members.
 * @param today - The reference date for calculations (defaults to now).
 */
export function detectAllRisks(today: Date = new Date()): DeliveryRisk[] {
  const allRisks: DeliveryRisk[] = [];
  const members = getAllTeamMembers();

  for (const member of members) {
    const activeTasks = getActiveTasksByAssignee(member.id);
    if (activeTasks.length === 0) continue;

    allRisks.push(...checkDeadlineFeasibility(member, activeTasks, today));
    allRisks.push(...checkDependencyRisks(activeTasks, member, today));
    allRisks.push(...checkStaleness(activeTasks, member, today));
  }

  // Sort by severity (High first) then by deadline (soonest first)
  const severityOrder = { High: 0, Medium: 1, Low: 2 };
  allRisks.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  return allRisks;
}
