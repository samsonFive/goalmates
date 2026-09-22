import type { DbClient } from "@/lib/db";
import { requireMembership } from "./authz";
import { scoreDuplicate } from "./duplicates";
import { createProject } from "./projects";
import { createTask } from "./tasks";
import { createEvent } from "./calendar";
import { DomainError, type Actor, type CaptureCandidateDraft } from "./types";
import { recordActivity } from "./activity";

export async function createCaptureRecord(
  db: DbClient,
  actor: Actor,
  input: {
    spaceId: string;
    sourceType: "image" | "document" | "text";
    storageKey?: string | null;
    mimeType?: string | null;
    originalName?: string | null;
    textInput?: string | null;
  },
) {
  await requireMembership(db, actor, input.spaceId);
  return db.capture.create({
    data: {
      spaceId: input.spaceId,
      userId: actor.id,
      sourceType: input.sourceType,
      storageKey: input.storageKey ?? null,
      mimeType: input.mimeType ?? null,
      originalName: input.originalName ?? null,
      textInput: input.textInput ?? null,
      status: "uploaded",
    },
  });
}

export async function attachCandidates(
  db: DbClient,
  actor: Actor,
  captureId: string,
  drafts: CaptureCandidateDraft[],
  provider: string,
  rawExtraction: string,
) {
  const capture = await db.capture.findUnique({ where: { id: captureId } });
  if (!capture) throw new DomainError("Capture not found.");
  await requireMembership(db, actor, capture.spaceId);

  const existingTasks = await db.task.findMany({
    where: { spaceId: capture.spaceId, status: { not: "archived" } },
    include: { project: true },
  });
  const projects = await db.project.findMany({ where: { spaceId: capture.spaceId } });

  await db.captureCandidate.deleteMany({ where: { captureId } });

  for (const draft of drafts) {
    const projectMatch = projects.find((project) => {
      const hint = draft.projectHint?.toLowerCase();
      return hint && project.name.toLowerCase().includes(hint);
    });
    const duplicates = existingTasks
      .map((task) =>
        scoreDuplicate(
          { title: draft.title, dueAt: draft.dueAt, projectId: projectMatch?.id },
          {
            id: task.id,
            title: task.title,
            status: task.status,
            dueAt: task.dueAt,
            projectId: task.projectId,
            projectName: task.project?.name,
          },
        ),
      )
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    await db.captureCandidate.create({
      data: {
        captureId,
        kind: draft.kind,
        title: draft.title,
        description: draft.description ?? null,
        dueAt: draft.dueAt ?? null,
        scheduledStart: draft.scheduledStart ?? null,
        estimateMinutes: draft.estimateMinutes ?? null,
        confidence: draft.confidence,
        projectHint: draft.projectHint ?? null,
        proposedProjectId: projectMatch?.id ?? null,
        duplicateJson: JSON.stringify(duplicates),
        evidence: draft.evidence ?? null,
      },
    });
  }

  return db.capture.update({
    where: { id: captureId },
    data: {
      status: drafts.length ? "needs_review" : "failed",
      provider,
      rawExtraction,
      processingError: drafts.length ? null : "No structured items could be extracted.",
    },
    include: { candidates: true },
  });
}

export async function markCaptureFailed(
  db: DbClient,
  captureId: string,
  provider: string,
  error: string,
) {
  return db.capture.update({
    where: { id: captureId },
    data: {
      status: "failed",
      provider,
      processingError: error,
    },
  });
}

export type ReconcileDecision = {
  candidateId: string;
  action: "accept" | "skip" | "merge" | "link";
  title?: string;
  dueAt?: Date | null;
  estimateMinutes?: number | null;
  kind?: "task" | "event" | "note";
  projectMode: "standalone" | "existing" | "create";
  projectId?: string | null;
  newProjectName?: string | null;
  mergeTaskId?: string | null;
};

export async function reconcileCapture(
  db: DbClient,
  actor: Actor,
  captureId: string,
  decisions: ReconcileDecision[],
) {
  const capture = await db.capture.findUnique({
    where: { id: captureId },
    include: { candidates: true },
  });
  if (!capture) throw new DomainError("Capture not found.");
  await requireMembership(db, actor, capture.spaceId);

  const created: { type: string; id: string; title: string }[] = [];

  await db.$transaction(async (tx) => {
    const txDb = tx as unknown as DbClient;
    for (const decision of decisions) {
      const candidate = capture.candidates.find((item) => item.id === decision.candidateId);
      if (!candidate) continue;

      if (decision.action === "skip") {
        await tx.captureCandidate.update({
          where: { id: candidate.id },
          data: { reconciliationStatus: "skipped" },
        });
        continue;
      }

      if (decision.action === "merge" || decision.action === "link") {
        if (!decision.mergeTaskId) throw new DomainError("Choose the existing task to merge or link.");
        await tx.captureCandidate.update({
          where: { id: candidate.id },
          data: {
            reconciliationStatus: decision.action === "merge" ? "merged" : "linked",
            acceptedEntityId: decision.mergeTaskId,
            acceptedEntityType: "task",
          },
        });
        continue;
      }

      let projectId = decision.projectId ?? null;
      if (decision.projectMode === "create") {
        const name = decision.newProjectName?.trim();
        if (!name) throw new DomainError("Name the new project.");
        const project = await createProject(txDb, actor, {
          spaceId: capture.spaceId,
          name,
        });
        projectId = project.id;
      } else if (decision.projectMode === "standalone") {
        projectId = null;
      }

      const title = (decision.title ?? candidate.title).trim();
      const kind = decision.kind ?? (candidate.kind === "event" ? "event" : "task");

      if (kind === "event") {
        const start = decision.dueAt ?? candidate.scheduledStart ?? candidate.dueAt ?? new Date();
        const end = new Date(start.getTime() + (decision.estimateMinutes ?? candidate.estimateMinutes ?? 60) * 60000);
        const event = await createEvent(txDb, actor, {
          spaceId: capture.spaceId,
          title,
          startAt: start,
          endAt: end,
          projectId,
        });
        await tx.captureCandidate.update({
          where: { id: candidate.id },
          data: {
            reconciliationStatus: "accepted",
            acceptedEntityId: event.id,
            acceptedEntityType: "event",
            title,
            proposedProjectId: projectId,
          },
        });
        created.push({ type: "event", id: event.id, title });
        continue;
      }

      const task = await createTask(txDb, actor, {
        spaceId: capture.spaceId,
        title,
        projectId,
        dueAt: decision.dueAt ?? candidate.dueAt,
        scheduledStart: candidate.scheduledStart,
        estimateMinutes: decision.estimateMinutes ?? candidate.estimateMinutes,
        sourceCaptureId: capture.id,
      });
      await tx.captureCandidate.update({
        where: { id: candidate.id },
        data: {
          reconciliationStatus: "accepted",
          acceptedEntityId: task.id,
          acceptedEntityType: "task",
          title,
          proposedProjectId: projectId,
        },
      });
      created.push({ type: "task", id: task.id, title });
    }

    await tx.capture.update({
      where: { id: captureId },
      data: { status: "reconciled", reconciledAt: new Date() },
    });
  });

  await recordActivity(db, {
    spaceId: capture.spaceId,
    actorId: actor.id,
    type: "capture.reconciled",
    entityType: "capture",
    entityId: capture.id,
    payload: { created: created.length },
  });

  return created;
}

export async function getCapture(db: DbClient, actor: Actor, captureId: string) {
  const capture = await db.capture.findUnique({
    where: { id: captureId },
    include: { candidates: true, space: true },
  });
  if (!capture) throw new DomainError("Capture not found.");
  await requireMembership(db, actor, capture.spaceId);
  return capture;
}

export async function listCaptures(db: DbClient, actor: Actor, spaceId?: string) {
  if (spaceId) await requireMembership(db, actor, spaceId);
  return db.capture.findMany({
    where: spaceId
      ? { spaceId }
      : { space: { memberships: { some: { userId: actor.id } } } },
    include: { candidates: true, space: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
}
