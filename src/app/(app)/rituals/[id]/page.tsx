import { prisma } from "@/lib/db";
import { requireActor } from "@/lib/current";
import { completeRitualAction } from "@/lib/actions";
import { listPlan } from "@/lib/domain/calendar";
import { listTasks } from "@/lib/domain/tasks";
import { calibrationInsights } from "@/lib/domain/learning";
import { Button, Panel, fieldClass } from "@/components/ui/primitives";
import { startOfDay } from "date-fns";

export default async function RitualDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const ritual = await prisma.ritual.findUniqueOrThrow({
    where: { id: (await params).id },
    include: { space: true },
  });
  const prompts = JSON.parse(ritual.prompts) as string[];
  const start = startOfDay(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + (ritual.kind.includes("weekly") || ritual.kind.includes("family") ? 7 : 1));
  const [plan, tasks, insight] = await Promise.all([
    listPlan(prisma, actor, { start, end, spaceId: ritual.spaceId }),
    listTasks(prisma, actor, { spaceId: ritual.spaceId }),
    calibrationInsights(prisma, actor),
  ]);
  const completed = tasks.filter((task) => task.status === "completed");
  const open = tasks.filter((task) => task.status !== "completed" && task.status !== "archived");

  return (
    <div className="space-y-5">
      <header>
        <p className="text-[11px] uppercase tracking-[0.16em] text-brass">{ritual.space.name}</p>
        <h1 className="font-display text-4xl text-forest-deep">{ritual.name}</h1>
      </header>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="What happened">
          <p className="text-sm text-ink-muted">
            {completed.length} completed · {open.length} still open · {plan.blocks.length} planned blocks
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {completed.slice(0, 8).map((task) => (
              <li key={task.id}>✓ {task.title}</li>
            ))}
          </ul>
          {ritual.kind.includes("weekly") || ritual.kind === "monthly_review" ? (
            <p className="mt-4 text-sm text-ink-muted">{insight.detail}</p>
          ) : null}
        </Panel>
        <Panel title="Reflection">
          <form action={completeRitualAction} className="space-y-3">
            <input type="hidden" name="ritualId" value={ritual.id} />
            {prompts.map((prompt) => (
              <label key={prompt} className="block text-sm">
                {prompt}
                <textarea className={`${fieldClass} mt-1 min-h-20 py-2`} name={`answer-${prompt}`} />
              </label>
            ))}
            <Button type="submit">Close this ritual</Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
