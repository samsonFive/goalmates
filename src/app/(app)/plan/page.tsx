import { addDays, format, startOfWeek } from "date-fns";
import { prisma } from "@/lib/db";
import { requireActor } from "@/lib/current";
import { resolveSpace } from "@/lib/space-query";
import { listPlan } from "@/lib/domain/calendar";
import { scheduleTaskAction } from "@/lib/actions";
import { Button, Panel, fieldClass } from "@/components/ui/primitives";
import { TaskRow } from "@/components/tasks/TaskRow";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ space?: string }>;
}) {
  const actor = await requireActor();
  const { current } = await resolveSpace(actor, (await searchParams).space);
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = addDays(start, 7);
  const plan = current
    ? await listPlan(prisma, actor, { start, end, spaceId: current.id })
    : { events: [], blocks: [], tasks: [] };
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));

  return (
    <div className="space-y-5">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">Plan</p>
        <h1 className="font-display text-4xl text-forest-deep">Week on the desk</h1>
        <p className="mt-2 text-ink-muted">
          Time blocks schedule tasks. Events stay events. They share a calendar without becoming the same thing.
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="overflow-x-auto">
          <div className="grid min-w-[720px] grid-cols-7 gap-2">
            {days.map((day) => {
              const dayBlocks = plan.blocks.filter((block) => format(block.startAt, "yyyy-MM-dd") === format(day, "yyyy-MM-dd"));
              const dayEvents = plan.events.filter((event) => format(event.startAt, "yyyy-MM-dd") === format(day, "yyyy-MM-dd"));
              return (
                <section key={day.toISOString()} className="gm-panel min-h-64 p-3">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    {format(day, "EEE d")}
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm">
                    {dayBlocks.map((block) => (
                      <li key={block.id} className="border-l-2 border-forest pl-2">
                        <span className="block text-[11px] text-ink-faint">{format(block.startAt, "h:mm a")} task</span>
                        {block.task?.title ?? block.title}
                      </li>
                    ))}
                    {dayEvents.map((event) => (
                      <li key={event.id} className="border-l-2 border-brass pl-2">
                        <span className="block text-[11px] text-ink-faint">{format(event.startAt, "h:mm a")} event</span>
                        {event.title}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
        <Panel title="Unscheduled work" kicker="Place into the week">
          <ul>
            {plan.tasks
              .filter((task) => !task.scheduledStart)
              .map((task) => (
                <li key={task.id} className="border-b border-paper-rule py-3">
                  <TaskRow task={task} compact />
                  <form action={scheduleTaskAction} className="mt-2 grid grid-cols-[1fr_90px_auto] gap-2">
                    <input type="hidden" name="taskId" value={task.id} />
                    <input className={fieldClass} type="datetime-local" name="startAt" required />
                    <input className={fieldClass} name="minutes" defaultValue={task.estimateMinutes ?? 45} />
                    <Button type="submit" variant="secondary">
                      Place
                    </Button>
                  </form>
                </li>
              ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
