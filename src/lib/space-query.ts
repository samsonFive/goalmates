import { prisma } from "@/lib/db";
import { listSpaces } from "@/lib/domain/spaces";
import type { Actor } from "@/lib/domain/types";

export async function resolveSpace(actor: Actor, spaceId?: string | null) {
  const spaces = await listSpaces(prisma, actor);
  const current =
    spaces.find((space) => space.id === spaceId) ??
    spaces.find((space) => space.type === "shared") ??
    spaces[0];
  return { spaces, current };
}
