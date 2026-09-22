import type { DbClient } from "@/lib/db";
import { visibleSpaceIds } from "./authz";
import type { Actor } from "./types";

export async function recordActivity(
  db: DbClient,
  input: {
    spaceId: string;
    actorId: string;
    type: string;
    entityType: string;
    entityId: string;
    payload?: Record<string, unknown>;
  },
) {
  return db.activity.create({
    data: {
      spaceId: input.spaceId,
      actorId: input.actorId,
      type: input.type,
      entityType: input.entityType,
      entityId: input.entityId,
      payload: JSON.stringify(input.payload ?? {}),
    },
  });
}

export async function listActivity(db: DbClient, actor: Actor, spaceId?: string, take = 30) {
  const spaceIds = spaceId ? [spaceId] : await visibleSpaceIds(db, actor);
  return db.activity.findMany({
    where: { spaceId: { in: spaceIds } },
    include: { actor: { select: { id: true, name: true } }, space: true },
    orderBy: { createdAt: "desc" },
    take,
  });
}
