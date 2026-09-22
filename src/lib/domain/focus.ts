import type { DbClient } from "@/lib/db";
import { requireMembership } from "./authz";
import { DomainError, type Actor } from "./types";

export async function startFocus(
  db: DbClient,
  actor: Actor,
  input: { spaceId: string; taskId?: string | null; intention?: string | null; plannedMinutes: number },
) {
  await requireMembership(db, actor, input.spaceId);
  if (input.plannedMinutes < 5) throw new DomainError("Give the session at least 5 minutes.");
  if (input.taskId) {
    await db.task.update({
      where: { id: input.taskId },
      data: { status: "in_progress" },
    });
  }
  return db.focusSession.create({
    data: {
      userId: actor.id,
      spaceId: input.spaceId,
      taskId: input.taskId ?? null,
      intention: input.intention ?? null,
      plannedMinutes: input.plannedMinutes,
    },
  });
}

export async function finishFocus(
  db: DbClient,
  actor: Actor,
  input: {
    sessionId: string;
    actualMinutes: number;
    outcome: "completed" | "left_open" | "abandoned";
    notes?: string | null;
    completeTask?: boolean;
  },
) {
  const session = await db.focusSession.findUnique({ where: { id: input.sessionId } });
  if (!session || session.userId !== actor.id) throw new DomainError("Focus session not found.");

  const updated = await db.focusSession.update({
    where: { id: session.id },
    data: {
      actualMinutes: input.actualMinutes,
      endedAt: new Date(),
      outcome: input.outcome,
      notes: input.notes ?? null,
    },
  });

  if (session.taskId) {
    const current = await db.task.findUnique({ where: { id: session.taskId } });
    const nextActual = (current?.actualMinutes ?? 0) + input.actualMinutes;
    await db.task.update({
      where: { id: session.taskId },
      data: {
        actualMinutes: nextActual,
        status: input.completeTask ? "completed" : current?.status === "completed" ? "completed" : "open",
        completedAt: input.completeTask ? new Date() : current?.completedAt,
      },
    });
  }

  return updated;
}

export async function getFocus(db: DbClient, actor: Actor, sessionId: string) {
  const session = await db.focusSession.findUnique({
    where: { id: sessionId },
    include: { task: true, space: true },
  });
  if (!session || session.userId !== actor.id) throw new DomainError("Focus session not found.");
  return session;
}

export async function activeFocus(db: DbClient, actor: Actor) {
  return db.focusSession.findFirst({
    where: { userId: actor.id, endedAt: null },
    include: { task: true, space: true },
    orderBy: { startedAt: "desc" },
  });
}
