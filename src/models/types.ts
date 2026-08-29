// ─────────────────────────────────────────────────────────────
// Data Model Types
// All entities and analysis output shapes for the Workload Agent.
// ─────────────────────────────────────────────────────────────

// ── Enums & Literals ──

/** Task priority: P0 = most critical, P3 = lowest */
export type Priority = "P0" | "P1" | "P2" | "P3";

/** Task lifecycle status */
export type TaskStatus = "not_started" | "in_progress" | "blocked" | "done";

/** Workload classification bucket for a team member */
export type LoadBucket = "Idle" | "Underloaded" | "Balanced" | "Overloaded" | "Critical";

/** Delivery risk severity */
export type RiskSeverity = "Low" | "Medium" | "High";

/** What kind of risk was detected */
export type RiskType = "deadline_feasibility" | "dependency" | "staleness";

// ── Core Entities ──

export interface DateRange {
  start: string; // ISO date
  end: string;   // ISO date
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  weeklyCapacityHours: number;
  skills: string[];
  timeOff: DateRange[]; // periods of unavailability
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  projectId: string;
  estimatedEffort: number;  // hours
  priority: Priority;
  status: TaskStatus;
  deadline: string;         // ISO date
  dependencies: string[];   // task IDs this is blocked by
  createdAt: string;        // ISO datetime
  updatedAt: string;        // ISO datetime
}

export interface Project {
  id: string;
  name: string;
  priority: Priority;
  deadline: string;         // ISO date
  owner: string;
}

// ── Analysis Output Shapes ──

export interface PersonWorkloadScore {
  memberId: string;
  memberName: string;
  role: string;
  weeklyCapacityHours: number;
  currentAllocatedHours: number;    // derived from active tasks only
  loadRatio: number;                // allocated / capacity
  weightedLoadRatio: number;        // priority-weighted version
  bucket: LoadBucket;
  activeTasks: Task[];
}

export interface DeliveryRisk {
  taskId: string;
  taskTitle: string;
  projectId: string;
  memberId: string;
  memberName: string;
  riskType: RiskType;
  severity: RiskSeverity;
  reason: string;                   // plain-language explanation
  deadline: string;
  remainingEffort?: number;         // hours, for deadline risks
  availableHours?: number;          // hours until deadline, for deadline risks
}

export interface IdleCapacity {
  memberId: string;
  memberName: string;
  role: string;
  skills: string[];
  weeklyCapacityHours: number;
  currentAllocatedHours: number;
  freeHours: number;
  loadRatio: number;
  bucket: LoadBucket;
}

export interface RedistributionSuggestion {
  taskId: string;
  taskTitle: string;
  effortHours: number;
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  rationale: string;
  fromStatusBefore: LoadBucket;
  fromStatusAfter: LoadBucket;
  toStatusBefore: LoadBucket;
  toStatusAfter: LoadBucket;
}

export interface TeamSummary {
  totalCapacityHours: number;
  totalAllocatedHours: number;
  utilizationPercent: number;
  bucketCounts: Record<LoadBucket, number>;
  idlePool: { memberId: string; memberName: string; freeHours: number }[];
  riskCountsBySeverity: Record<RiskSeverity, number>;
  topRecommendedActions: string[];
}

export interface AnalysisResult {
  timestamp: string;
  currentDate: string;              // the "today" used for all calculations
  workloadScores: PersonWorkloadScore[];
  deliveryRisks: DeliveryRisk[];
  idleCapacity: IdleCapacity[];
  redistributionSuggestions: RedistributionSuggestion[];
  teamSummary: TeamSummary;
}
