import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Actor } from "@/lib/domain/types";

export async function requireActor(): Promise<Actor> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHENTICATED");
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error("UNAUTHENTICATED");
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    timezone: user.timezone,
  };
}

export async function optionalActor() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return requireActor();
}
