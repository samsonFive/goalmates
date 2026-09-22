import type { DbClient } from "@/lib/db";
import { AuthzError, type Actor, type MembershipRole } from "./types";

export async function getMembership(db: DbClient, actor: Actor, spaceId: string) {
  return db.membership.findUnique({
    where: { userId_spaceId: { userId: actor.id, spaceId } },
    include: { space: true },
  });
}

export async function requireMembership(db: DbClient, actor: Actor, spaceId: string) {
  const membership = await getMembership(db, actor, spaceId);
  if (!membership) throw new AuthzError();
  return membership;
}

export async function requireRole(
  db: DbClient,
  actor: Actor,
  spaceId: string,
  roles: MembershipRole[],
) {
  const membership = await requireMembership(db, actor, spaceId);
  if (!roles.includes(membership.role as MembershipRole)) {
    throw new AuthzError("This action needs a space owner or admin.");
  }
  return membership;
}

export async function visibleSpaceIds(db: DbClient, actor: Actor) {
  const memberships = await db.membership.findMany({
    where: { userId: actor.id },
    select: { spaceId: true },
  });
  return memberships.map((item) => item.spaceId);
}

export async function assertTaskVisible(db: DbClient, actor: Actor, taskId: string) {
  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task) throw new AuthzError();
  await requireMembership(db, actor, task.spaceId);
  return task;
}
