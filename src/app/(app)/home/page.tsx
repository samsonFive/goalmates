import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { requireActor } from "@/lib/current";
import { resolveSpace } from "@/lib/space-query";
import { listTasks } from "@/lib/domain/tasks";
import { listPlan } from "@/lib/domain/calendar";
import { dueRituals } from "@/lib/domain/rituals";
import { listProjects } from "@/lib/domain/projects";
import { calibrationInsights } from "@/lib/domain/learning";
import { activeFocus } from "@/lib/domain/focus";
import { Button, EmptyState, Panel } from "@/components/ui/primitives";
import { TaskRow } from "@/components/tasks/TaskRow";
import { captureTextAction, startFocusAction } from "@/lib/actions";
import { fieldClass } from "@/components/ui/primitives";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ space?: string }>;
}) {
  const actor = await requireActor();
  const params = await searchParams;
  const { current } = await resolveSpace(actor, params.space);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [tasks, plan, rituals, projects, insight, focus] = await Promise.all([
    listTasks(prisma, actor, { spaceId: current?.id, status: ["open", "in_progress"] }),
    current ? listPlan(prisma, actor, { start, end, spaceId: current.id }) : Promise.resolve({ blocks: [], events: [], tasks: [] }),
    dueRituals(prisma, actor),
    listProjects(prisma, actor, current?.id),
    calibrationInsights(prisma, actor),
    activeFocus(prisma, actor),
  ]);

  const now = tasks.slice(0, 6);
  const pool = tasks.filter((task) => task.collaborationState === "pool" || task.collaborationState === "requested");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">
            {format(new Date(), "EEEE, MMM d")}
          </p>
          <h1 className="font-display text-4xl text-forest-deep">Hello, {actor.name.split(" ")[0]}.</h1>
          <p className="mt-1 text-ink-muted">
            {current?.type === "shared" ? `Shared space: ${current.name}` : `Private space: ${current?.name}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/opportunity">
            <Button type="button">I have some time</Button>
          </Link>
          <Link href="/capture">
            <Button type="button" variant="secondary">
              Capture
            </Button>
          </Link>
        </div>
      </header>

      {focus ? (
        <Panel kicker="In progress" title="Focus session is open">
          <p>
            {focus.task?.title ?? focus.intention} · {focus.plannedMinutes} minutes
          </p>
          <Link className="mt-3 inline-block font-semibold text-forest underline" href={`/focus/${focus.id}`}>
            Return to timer
          </Link>
        </Panel>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel kicker="Today's desk" title="What deserves attention">
          {now.length === 0 ? (
            <EmptyState title="Nothing open in this space" body="Capture a note, photograph a planner, or add a standalone task." />
          ) : (
            now.map((task) => <TaskRow key={task.id} task={task} />)
          )}
        </Panel>
        <div className="space-y-5">
          <Panel kicker="Quick capture" title="Get it out of your head">
            <form action={captureTextAction} className="space-y-3">
              <input type="hidden" name="spaceId" value={current?.id} />
              <textarea
                name="text"
                required
                className={`${fieldClass} min-h-24 py-2`}
                placeholder="Call dentist tomorrow 20m&#10;Paint trim 90m&#10;Pickup hardware Saturday"
              />
              <Button type="submit">Review extracted items</Button>
            </form>
          </Panel>
          <Panel kicker="Due ritual" title={rituals[0]?.name ?? "No ritual waiting"}>
            {rituals[0] ? (
              <div>
                <p className="text-sm text-ink-muted">{rituals[0].space.name}</p>
                <Link className="mt-3 inline-block font-semibold text-forest underline" href={`/rituals/${rituals[0].id}`}>
                  Open {rituals[0].name}
                </Link>
              </div>
            ) : (
              <p className="text-sm text-ink-muted">Today's planning loops are clear.</p>
            )}
          </Panel>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Panel kicker="Planned time" title="On the calendar">
          {plan.blocks.length === 0 && plan.events.length === 0 ? (
            <p className="text-sm text-ink-muted">No time blocks or events for today yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {plan.blocks.map((block) => (
                <li key={block.id}>
                  <span className="font-semibold">{format(block.startAt, "h:mm a")}</span> · {block.task?.title ?? block.title}{" "}
                  <span className="text-ink-faint">(task block)</span>
                </li>
              ))}
              {plan.events.map((event) => (
                <li key={event.id}>
                  <span className="font-semibold">{format(event.startAt, "h:mm a")}</span> · {event.title}{" "}
                  <span className="text-ink-faint">(event)</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel kicker="Shared work" title="Pool and asks">
          {pool.length === 0 ? (
            <p className="text-sm text-ink-muted">No open shared requests in this space.</p>
          ) : (
            pool.slice(0, 5).map((task) => <TaskRow key={task.id} task={task} compact />)
          )}
        </Panel>
        <Panel kicker="Projects" title="Meaningful progress">
          {projects.length === 0 ? (
            <p className="text-sm text-ink-muted">No projects yet. Tasks can stay standalone.</p>
          ) : (
            <ul className="space-y-3">
              {projects.slice(0, 4).map((project) => (
                <li key={project.id}>
                  <Link className="font-semibold hover:underline" href={`/projects/${project.id}`}>
                    {project.name}
                  </Link>
                  <div className="mt-1 h-1.5 bg-forest-soft">
                    <div className="h-1.5 bg-forest" style={{ width: `${project.progress.percent}%` }} />
                  </div>
                  <p className="text-xs text-ink-muted">
                    {project.progress.completed} done · {project.progress.open} open
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel kicker="Learn" title={insight.headline}>
        <p className="text-sm text-ink-muted">{insight.detail}</p>
      </Panel>

      {!focus && current ? (
        <form action={startFocusAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="spaceId" value={current.id} />
          <input type="hidden" name="plannedMinutes" value="25" />
          <input className={fieldClass} name="intention" placeholder="Ad hoc focus intention" />
          <Button type="submit" variant="secondary">
            Start 25m focus
          </Button>
        </form>
      ) : null}
    </div>
  );
}
