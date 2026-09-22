import { startOfDay } from "date-fns";
import type { DbClient } from "@/lib/db";
import { requireMembership, visibleSpaceIds } from "./authz";
import { DomainError, type Actor, type RitualKind } from "./types";

const DEFAULT_PROMPTS: Record<RitualKind, string[]> = {
  daily_planning: ["What deserves time today?", "What can wait?", "Any shared asks?"],
  daily_debrief: ["What landed?", "What moved?", "What should tomorrow inherit?"],
  weekly_planning: ["What is actually possible this week?", "Which projects need a next action?"],
  monthly_review: ["What patterns showed up?", "What should we stop planning like this?"],
  family_planning: ["Shared load this week?", "Anything one of us can take off the other?"],
  custom: ["What is this ritual for?"],
};

export async function ensureDefaultRituals(db: DbClient, spaceId: string) {
  const existing = await db.ritual.count({ where: { spaceId } });
  if (existing > 0) return;
  const defaults: { name: string; kind: RitualKind; cadence: string; expectedMinutes: number }[] = [
    { name: "Daily planning", kind: "daily_planning", cadence: "daily", expectedMinutes: 10 },
    { name: "Daily debrief", kind: "daily_debrief", cadence: "daily", expectedMinutes: 8 },
    { name: "Weekly planning", kind: "weekly_planning", cadence: "weekly", expectedMinutes: 25 },
    { name: "Monthly review", kind: "monthly_review", cadence: "monthly", expectedMinutes: 30 },
    { name: "Family planning", kind: "family_planning", cadence: "weekly", expectedMinutes: 20 },
  ];
  await db.ritual.createMany({
    data: defaults.map((ritual) => ({
      spaceId,
      ...ritual,
      prompts: JSON.stringify(DEFAULT_PROMPTS[ritual.kind]),
    })),
  });
}

export async function createRitual(
  db: DbClient,
  actor: Actor,
  input: { spaceId: string; name: string; kind: RitualKind; cadence: string; prompts?: string[] },
) {
  await requireMembership(db, actor, input.spaceId);
  return db.ritual.create({
    data: {
      spaceId: input.spaceId,
      name: input.name.trim(),
      kind: input.kind,
      cadence: input.cadence,
      prompts: JSON.stringify(input.prompts ?? DEFAULT_PROMPTS[input.kind]),
    },
  });
}

export async function listRituals(db: DbClient, actor: Actor, spaceId?: string) {
  if (spaceId) await requireMembership(db, actor, spaceId);
  return db.ritual.findMany({
    where: spaceId
      ? { spaceId, active: true }
      : { active: true, space: { memberships: { some: { userId: actor.id } } } },
    include: {
      space: true,
      occurrences: {
        where: { userId: actor.id },
        orderBy: { scheduledAt: "desc" },
        take: 5,
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function completeRitual(
  db: DbClient,
  actor: Actor,
  ritualId: string,
  answers: Record<string, string>,
) {
  const ritual = await db.ritual.findUnique({ where: { id: ritualId } });
  if (!ritual) throw new DomainError("Ritual not found.");
  await requireMembership(db, actor, ritual.spaceId);
  return db.ritualOccurrence.create({
    data: {
      ritualId,
      userId: actor.id,
      scheduledAt: startOfDay(new Date()),
      completedAt: new Date(),
      answers: JSON.stringify(answers),
    },
  });
}

export async function dueRituals(db: DbClient, actor: Actor) {
  const spaceIds = await visibleSpaceIds(db, actor);
  const rituals = await db.ritual.findMany({
    where: { spaceId: { in: spaceIds }, active: true },
    include: {
      space: true,
      occurrences: {
        where: { userId: actor.id, completedAt: { gte: startOfDay(new Date()) } },
      },
    },
  });
  return rituals.filter((ritual) => ritual.occurrences.length === 0);
}
