export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { requireActor } from "@/lib/current";
import { prisma } from "@/lib/db";
import { listSpaces } from "@/lib/domain/spaces";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let actor;
  try {
    actor = await requireActor();
  } catch {
    redirect("/login");
  }
  const spaces = await listSpaces(prisma, actor);
  const current = spaces.find((space) => space.type === "shared") ?? spaces[0];
  return (
    <AppShell
      actor={actor}
      currentSpaceId={current?.id}
      spaces={spaces.map((space) => ({ id: space.id, name: space.name, type: space.type }))}
    >
      {children}
    </AppShell>
  );
}
