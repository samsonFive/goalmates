import type { DbClient } from "@/lib/db";
import { requireMembership, visibleSpaceIds } from "./authz";
import { DomainError, type Actor } from "./types";
import { recordActivity } from "./activity";

export async function createEvent(
  db: DbClient,
  actor: Actor,
  input: {
    spaceId: string;
    title: string;
    startAt: Date;
    endAt: Date;
    taskId?: string | null;
    projectId?: string | null;
    notes?: string | null;
  },
) {
  await requireMembership(db, actor, input.spaceId);
  if (!input.title.trim()) throw new DomainError("An event needs a title.");
  return db.calendarEvent.create({
    data: {
      spaceId: input.spaceId,
      title: input.title.trim(),
      startAt: input.startAt,
      endAt: input.endAt,
      source: "internal",
      taskId: input.taskId ?? null,
      projectId: input.projectId ?? null,
      notes: input.notes ?? null,
    },
  });
}

export async function scheduleTask(
  db: DbClient,
  actor: Actor,
  input: { taskId: string; startAt: Date; endAt: Date },
) {
  const task = await db.task.findUnique({ where: { id: input.taskId } });
  if (!task) throw new DomainError("Task not found.");
  await requireMembership(db, actor, task.spaceId);

  const block = await db.timeBlock.create({
    data: {
      spaceId: task.spaceId,
      taskId: task.id,
      title: task.title,
      startAt: input.startAt,
      endAt: input.endAt,
    },
  });

  await db.task.update({
    where: { id: task.id },
    data: { scheduledStart: input.startAt, scheduledEnd: input.endAt },
  });

  await recordActivity(db, {
    spaceId: task.spaceId,
    actorId: actor.id,
    type: "task.scheduled",
    entityType: "task",
    entityId: task.id,
    payload: { startAt: input.startAt.toISOString() },
  });

  return block;
}

export async function listPlan(
  db: DbClient,
  actor: Actor,
  range: { start: Date; end: Date; spaceId?: string },
) {
  const spaceIds = range.spaceId ? [range.spaceId] : await visibleSpaceIds(db, actor);
  if (range.spaceId) await requireMembership(db, actor, range.spaceId);

  const [events, blocks, tasks] = await Promise.all([
    db.calendarEvent.findMany({
      where: { spaceId: { in: spaceIds }, startAt: { lte: range.end }, endAt: { gte: range.start } },
      include: { space: true },
      orderBy: { startAt: "asc" },
    }),
    db.timeBlock.findMany({
      where: { spaceId: { in: spaceIds }, startAt: { lte: range.end }, endAt: { gte: range.start } },
      include: { task: true, space: true },
      orderBy: { startAt: "asc" },
    }),
    db.task.findMany({
      where: {
        spaceId: { in: spaceIds },
        status: { in: ["open", "in_progress"] },
      },
      include: { project: true, space: true, owner: { select: { id: true, name: true } } },
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
    }),
  ]);

  return { events, blocks, tasks };
}
