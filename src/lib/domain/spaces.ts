import type { DbClient } from "@/lib/db";
import { AuthzError, DomainError, type Actor } from "./types";
import { requireMembership, requireRole } from "./authz";

export async function createUserWithPersonalSpace(
  db: DbClient,
  input: { email: string; name: string; passwordHash: string; isDemo?: boolean; timezone?: string },
) {
  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email.toLowerCase().trim(),
        name: input.name.trim(),
        passwordHash: input.passwordHash,
        isDemo: input.isDemo ?? false,
        timezone: input.timezone ?? "America/Los_Angeles",
      },
    });
    const space = await tx.space.create({
      data: {
        type: "personal",
        name: `${user.name}'s space`,
        ownerId: user.id,
      },
    });
    await tx.membership.create({
      data: { userId: user.id, spaceId: space.id, role: "owner" },
    });
    return { user, space };
  });
}

export async function createSharedSpace(db: DbClient, actor: Actor, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new DomainError("A shared space needs a name.");
  return db.$transaction(async (tx) => {
    const space = await tx.space.create({
      data: { type: "shared", name: trimmed, ownerId: actor.id },
    });
    await tx.membership.create({
      data: { userId: actor.id, spaceId: space.id, role: "owner" },
    });
    await tx.activity.create({
      data: {
        spaceId: space.id,
        actorId: actor.id,
        type: "space.created",
        entityType: "space",
        entityId: space.id,
        payload: JSON.stringify({ name: trimmed }),
      },
    });
    return space;
  });
}

export async function inviteToSpace(
  db: DbClient,
  actor: Actor,
  spaceId: string,
  email: string,
  role: "admin" | "member" = "member",
) {
  const membership = await requireRole(db, actor, spaceId, ["owner", "admin"]);
  if (membership.space.type !== "shared") {
    throw new DomainError("Personal spaces cannot add other members.");
  }
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) throw new DomainError("No GoalMates account uses that email yet.");
  return db.membership.upsert({
    where: { userId_spaceId: { userId: user.id, spaceId } },
    update: { role },
    create: { userId: user.id, spaceId, role },
  });
}

export async function listSpaces(db: DbClient, actor: Actor) {
  return db.space.findMany({
    where: { memberships: { some: { userId: actor.id } } },
    include: {
      memberships: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

export async function getSpaceOrThrow(db: DbClient, actor: Actor, spaceId: string) {
  await requireMembership(db, actor, spaceId);
  const space = await db.space.findUnique({
    where: { id: spaceId },
    include: {
      memberships: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!space) throw new AuthzError();
  return space;
}
