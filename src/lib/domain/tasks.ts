import type { DbClient } from "@/lib/db";
import { assertTaskVisible, requireMembership, visibleSpaceIds } from "./authz";
import { DomainError, type Actor, type CollaborationState, type TaskStatus } from "./types";
import { recordActivity } from "./activity";

export type TaskInput = {
  spaceId: string;
  title: string;
  description?: string | null;
  projectId?: string | null;
  estimateMinutes?: number | null;
  dueAt?: Date | null;
  scheduledStart?: Date | null;
  scheduledEnd?: Date | null;
  priority?: string;
  importance?: string;
  tags?: string[];
  context?: string | null;
  collaborationState?: CollaborationState;
  ownerId?: string | null;
  assigneeId?: string | null;
  requesterId?: string | null;
  nudgePolicy?: string;
  sourceCaptureId?: string | null;
};

function parseTags(raw: string): string[] {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function withParsedTags<T extends { tags: string }>(task: T) {
  return { ...task, tagList: parseTags(task.tags) };
}

export async function createTask(db: DbClient, actor: Actor, input: TaskInput) {
  const membership = await requireMembership(db, actor, input.spaceId);
  const title = input.title.trim();
  if (!title) throw new DomainError("A task needs a title.");

  if (input.projectId) {
    const project = await db.project.findUnique({ where: { id: input.projectId } });
    if (!project || project.spaceId !== input.spaceId) {
      throw new DomainError("That project is not in this space.");
    }
  }

  const isShared = membership.space.type === "shared";
  const collaborationState =
    input.collaborationState ?? (isShared ? "pool" : "personal");

  if (!isShared && collaborationState !== "personal") {
    throw new DomainError("Private-space tasks stay personal unless moved to a shared space.");
  }

  const task = await db.task.create({
    data: {
      spaceId: input.spaceId,
      title,
      description: input.description ?? null,
      projectId: input.projectId ?? null,
      estimateMinutes: input.estimateMinutes ?? null,
      dueAt: input.dueAt ?? null,
      scheduledStart: input.scheduledStart ?? null,
      scheduledEnd: input.scheduledEnd ?? null,
      priority: input.priority ?? "normal",
      importance: input.importance ?? "normal",
      tags: JSON.stringify(input.tags ?? []),
      context: input.context ?? null,
      collaborationState,
      creatorId: actor.id,
      ownerId: input.ownerId ?? (collaborationState === "pool" ? null : actor.id),
      claimantId: collaborationState === "claimed" ? actor.id : null,
      requesterId: input.requesterId ?? (collaborationState === "requested" ? actor.id : null),
      assigneeId: input.assigneeId ?? null,
      nudgePolicy: input.nudgePolicy ?? "inherit",
      sourceCaptureId: input.sourceCaptureId ?? null,
    },
  });

  await recordActivity(db, {
    spaceId: task.spaceId,
    actorId: actor.id,
    type: collaborationState === "requested" ? "task.requested" : "task.created",
    entityType: "task",
    entityId: task.id,
    payload: { title: task.title, collaborationState },
  });

  return task;
}

export async function updateTask(
  db: DbClient,
  actor: Actor,
  taskId: string,
  patch: Partial<TaskInput> & { status?: TaskStatus; actualMinutes?: number | null },
) {
  const existing = await assertTaskVisible(db, actor, taskId);
  if (patch.projectId) {
    const project = await db.project.findUnique({ where: { id: patch.projectId } });
    if (!project || project.spaceId !== existing.spaceId) {
      throw new DomainError("That project is not in this space.");
    }
  }

  const nextStatus = patch.status ?? existing.status;
  const completedAt =
    nextStatus === "completed" && existing.status !== "completed"
      ? new Date()
      : nextStatus !== "completed"
        ? null
        : existing.completedAt;
  const archivedAt =
    nextStatus === "archived" && existing.status !== "archived" ? new Date() : existing.archivedAt;

  const task = await db.task.update({
    where: { id: taskId },
    data: {
      title: patch.title?.trim() ?? existing.title,
      description: patch.description === undefined ? existing.description : patch.description,
      projectId: patch.projectId === undefined ? existing.projectId : patch.projectId,
      estimateMinutes:
        patch.estimateMinutes === undefined ? existing.estimateMinutes : patch.estimateMinutes,
      actualMinutes: patch.actualMinutes === undefined ? existing.actualMinutes : patch.actualMinutes,
      dueAt: patch.dueAt === undefined ? existing.dueAt : patch.dueAt,
      scheduledStart:
        patch.scheduledStart === undefined ? existing.scheduledStart : patch.scheduledStart,
      scheduledEnd: patch.scheduledEnd === undefined ? existing.scheduledEnd : patch.scheduledEnd,
      priority: patch.priority ?? existing.priority,
      importance: patch.importance ?? existing.importance,
      tags: patch.tags ? JSON.stringify(patch.tags) : existing.tags,
      context: patch.context === undefined ? existing.context : patch.context,
      collaborationState: patch.collaborationState ?? existing.collaborationState,
      ownerId: patch.ownerId === undefined ? existing.ownerId : patch.ownerId,
      assigneeId: patch.assigneeId === undefined ? existing.assigneeId : patch.assigneeId,
      status: nextStatus,
      completedAt,
      archivedAt,
    },
  });

  if (completedAt && !existing.completedAt) {
    await recordActivity(db, {
      spaceId: task.spaceId,
      actorId: actor.id,
      type: "task.completed",
      entityType: "task",
      entityId: task.id,
      payload: { title: task.title },
    });
  }
  return task;
}

export async function claimTask(db: DbClient, actor: Actor, taskId: string) {
  const task = await assertTaskVisible(db, actor, taskId);
  if (task.collaborationState === "personal") {
    throw new DomainError("Personal tasks are already yours.");
  }
  const updated = await db.task.update({
    where: { id: taskId },
    data: {
      collaborationState: "claimed",
      claimantId: actor.id,
      ownerId: actor.id,
    },
  });
  await recordActivity(db, {
    spaceId: task.spaceId,
    actorId: actor.id,
    type: "task.claimed",
    entityType: "task",
    entityId: task.id,
    payload: { title: task.title },
  });
  return updated;
}

export async function releaseTask(db: DbClient, actor: Actor, taskId: string) {
  const task = await assertTaskVisible(db, actor, taskId);
  const updated = await db.task.update({
    where: { id: taskId },
    data: {
      collaborationState: "pool",
      claimantId: null,
      ownerId: null,
    },
  });
  await recordActivity(db, {
    spaceId: task.spaceId,
    actorId: actor.id,
    type: "task.released",
    entityType: "task",
    entityId: task.id,
    payload: { title: task.title },
  });
  return updated;
}

export async function requestTask(
  db: DbClient,
  actor: Actor,
  input: { spaceId: string; title: string; assigneeId: string; context?: string; estimateMinutes?: number },
) {
  return createTask(db, actor, {
    spaceId: input.spaceId,
    title: input.title,
    assigneeId: input.assigneeId,
    requesterId: actor.id,
    context: input.context ?? "errand",
    estimateMinutes: input.estimateMinutes,
    collaborationState: "requested",
    tags: input.context ? [input.context] : ["errand"],
  });
}

export async function listTasks(
  db: DbClient,
  actor: Actor,
  filter: {
    spaceId?: string;
    projectId?: string | null;
    status?: TaskStatus | TaskStatus[];
    collaborationState?: CollaborationState;
    includeArchived?: boolean;
    context?: string;
  } = {},
) {
  const spaceIds = filter.spaceId ? [filter.spaceId] : await visibleSpaceIds(db, actor);
  if (filter.spaceId) await requireMembership(db, actor, filter.spaceId);

  return db.task.findMany({
    where: {
      spaceId: { in: spaceIds },
      projectId: filter.projectId === undefined ? undefined : filter.projectId,
      status: Array.isArray(filter.status)
        ? { in: filter.status }
        : filter.status
          ? filter.status
          : filter.includeArchived
            ? undefined
            : { not: "archived" },
      collaborationState: filter.collaborationState,
      context: filter.context,
    },
    include: {
      project: true,
      owner: { select: { id: true, name: true } },
      claimant: { select: { id: true, name: true } },
      requester: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
      space: true,
    },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
  });
}

export async function getTask(db: DbClient, actor: Actor, taskId: string) {
  await assertTaskVisible(db, actor, taskId);
  return db.task.findUniqueOrThrow({
    where: { id: taskId },
    include: {
      project: true,
      owner: { select: { id: true, name: true } },
      claimant: { select: { id: true, name: true } },
      requester: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
      space: true,
      timeBlocks: { orderBy: { startAt: "asc" } },
    },
  });
}
