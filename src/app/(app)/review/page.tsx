import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireActor } from "@/lib/current";
import { resolveSpace } from "@/lib/space-query";
import { listTasks } from "@/lib/domain/tasks";
import { listProjects } from "@/lib/domain/projects";
import { listActivity } from "@/lib/domain/activity";
import { calibrationInsights } from "@/lib/domain/learning";
import { dueRituals } from "@/lib/domain/rituals";
import { Panel } from "@/components/ui/primitives";
import { format } from "date-fns";

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ space?: string }>;
}) {
  const actor = await requireActor();
  const { current } = await resolveSpace(actor, (await searchParams).space);
  const [tasks, projects, activity, insight, rituals] = await Promise.all([
    listTasks(prisma, actor, { spaceId: current?.id, includeArchived: true }),
    listProjects(prisma, actor, current?.id),
    listActivity(prisma, actor, current?.id),
    calibrationInsights(prisma, actor),
    dueRituals(prisma, actor),
  ]);
  const completed = tasks.filter((task) => task.status === "completed");
  const requests = tasks.filter((task) => task.collaborationState === "requested" || task.collaborationState === "pool");

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-4xl text-forest-deep">Review</h1>
        <p className="text-ink-muted">Look back without a scoreboard. History is here so next week can be more realistic.</p>
      </header>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={insight.headline} kicker="Calibration">
          <p className="text-sm text-ink-muted">{insight.detail}</p>
          {insight.overplanning ? (
            <p className="mt-3 text-sm">
              {insight.overplanning.completedCount} of {insight.overplanning.plannedCount} placed blocks were completed.
            </p>
          ) : null}
        </Panel>
        <Panel title="Waiting rituals">
          {rituals.map((ritual) => (
            <Link key={ritual.id} className="block py-2 font-semibold text-forest underline" href={`/rituals/${ritual.id}`}>
              {ritual.name}
            </Link>
          ))}
        </Panel>
        <Panel title="Completed">
          <ul className="space-y-2 text-sm">
            {completed.slice(0, 12).map((task) => (
              <li key={task.id}>
                {task.title}
                {task.estimateMinutes && task.actualMinutes
                  ? ` · ${task.estimateMinutes}m planned / ${task.actualMinutes}m actual`
                  : ""}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Shared still open">
          {requests.map((task) => (
            <p key={task.id} className="text-sm">
              {task.title} · {task.collaborationState}
            </p>
          ))}
        </Panel>
      </div>
      <Panel title="Coordination" kicker="Useful, not surveillance">
        <ul className="space-y-2 text-sm">
          {activity.map((item) => (
            <li key={item.id}>
              <span className="text-ink-faint">{format(item.createdAt, "MMM d, p")}</span> · {item.actor.name} · {item.type.replace(".", " ")}
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Projects">
        {projects.map((project) => (
          <p key={project.id} className="text-sm">
            <Link className="font-semibold hover:underline" href={`/projects/${project.id}`}>
              {project.name}
            </Link>{" "}
            · {project.progress.percent}% from work
          </p>
        ))}
      </Panel>
    </div>
  );
}
