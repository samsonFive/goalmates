import { prisma } from "@/lib/db";
import { requireActor } from "@/lib/current";
import { getTask } from "@/lib/domain/tasks";
import { completeTaskAction, scheduleTaskAction, startFocusAction } from "@/lib/actions";
import { Button, Field, Panel, fieldClass } from "@/components/ui/primitives";
import { format } from "date-fns";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const task = await getTask(prisma, actor, (await params).id);

  return (
    <div className="space-y-5">
      <header>
        <p className="text-[11px] uppercase tracking-[0.16em] text-brass">
          {task.project?.name ?? "Standalone task"} · {task.space.name}
        </p>
        <h1 className="font-display text-4xl text-forest-deep">{task.title}</h1>
        <p className="mt-2 text-ink-muted">{task.description || "No notes yet."}</p>
      </header>
      <div className="grid gap-5 md:grid-cols-2">
        <Panel title="Details">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>Status</dt><dd>{task.status}</dd></div>
            <div className="flex justify-between"><dt>Estimate</dt><dd>{task.estimateMinutes ?? "—"} min</dd></div>
            <div className="flex justify-between"><dt>Actual</dt><dd>{task.actualMinutes ?? "—"} min</dd></div>
            <div className="flex justify-between"><dt>Collaboration</dt><dd>{task.collaborationState}</dd></div>
            <div className="flex justify-between"><dt>Due</dt><dd>{task.dueAt ? format(task.dueAt, "PPp") : "—"}</dd></div>
          </dl>
        </Panel>
        <Panel title="Do this now">
          <div className="flex flex-wrap gap-3">
            <form action={completeTaskAction}>
              <input type="hidden" name="taskId" value={task.id} />
              <Button type="submit">Mark complete</Button>
            </form>
            <form action={startFocusAction}>
              <input type="hidden" name="spaceId" value={task.spaceId} />
              <input type="hidden" name="taskId" value={task.id} />
              <input type="hidden" name="plannedMinutes" value={task.estimateMinutes ?? 25} />
              <Button type="submit" variant="secondary">
                Start focus
              </Button>
            </form>
          </div>
          <form action={scheduleTaskAction} className="mt-4 space-y-2">
            <input type="hidden" name="taskId" value={task.id} />
            <Field label="Place on calendar">
              <input className={fieldClass} type="datetime-local" name="startAt" required />
            </Field>
            <input type="hidden" name="minutes" value={task.estimateMinutes ?? 45} />
            <Button type="submit" variant="ghost">
              Schedule
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
