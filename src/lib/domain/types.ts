export type SpaceType = "personal" | "shared";
export type MembershipRole = "owner" | "admin" | "member";
export type TaskStatus = "open" | "in_progress" | "completed" | "archived";
export type CollaborationState =
  | "personal"
  | "pool"
  | "claimed"
  | "requested"
  | "collaborative";
export type ProjectStatus = "active" | "paused" | "completed" | "archived";
export type CaptureStatus =
  | "uploaded"
  | "processing"
  | "needs_review"
  | "reconciled"
  | "failed";
export type CandidateKind = "task" | "event" | "note" | "project";
export type ReconciliationStatus =
  | "pending"
  | "accepted"
  | "skipped"
  | "merged"
  | "linked";
export type RitualKind =
  | "daily_planning"
  | "daily_debrief"
  | "weekly_planning"
  | "monthly_review"
  | "family_planning"
  | "custom";

export type Actor = {
  id: string;
  email: string;
  name: string;
  timezone: string;
};

export type DuplicateCandidate = {
  taskId: string;
  title: string;
  status: string;
  projectName: string | null;
  score: number;
  reason: string;
};

export type CaptureCandidateDraft = {
  kind: CandidateKind;
  title: string;
  description?: string | null;
  dueAt?: Date | null;
  scheduledStart?: Date | null;
  estimateMinutes?: number | null;
  confidence: number;
  projectHint?: string | null;
  evidence?: string | null;
};

export class AuthzError extends Error {
  constructor(message = "You do not have access to that record.") {
    super(message);
    this.name = "AuthzError";
  }
}

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
