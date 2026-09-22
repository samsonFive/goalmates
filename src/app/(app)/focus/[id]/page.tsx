import { prisma } from "@/lib/db";
import { requireActor } from "@/lib/current";
import { getFocus } from "@/lib/domain/focus";
import { FocusTimer } from "@/components/focus/FocusTimer";

export default async function FocusPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const session = await getFocus(prisma, actor, (await params).id);
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-display text-4xl text-forest-deep">Focus</h1>
      <FocusTimer
        sessionId={session.id}
        plannedMinutes={session.plannedMinutes}
        startedAt={session.startedAt.toISOString()}
        title={session.task?.title ?? session.intention ?? "Open session"}
        hasTask={Boolean(session.taskId)}
      />
    </div>
  );
}
