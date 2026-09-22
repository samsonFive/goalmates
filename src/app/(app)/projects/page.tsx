import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireActor } from "@/lib/current";
import { resolveSpace } from "@/lib/space-query";
import { listProjects } from "@/lib/domain/projects";
import { createProjectAction } from "@/lib/actions";
import { Button, Field, Panel, fieldClass } from "@/components/ui/primitives";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ space?: string }>;
}) {
  const actor = await requireActor();
  const { current } = await resolveSpace(actor, (await searchParams).space);
  const projects = await listProjects(prisma, actor, current?.id);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-4xl text-forest-deep">Projects</h1>
        <p className="text-ink-muted">Outcomes with optional context. Progress comes from work, not a fake percentage.</p>
      </header>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="gm-panel block p-4 hover:border-forest-mid">
              <h2 className="font-display text-2xl text-forest-deep">{project.name}</h2>
              <p className="text-sm text-ink-muted">{project.outcome || "No outcome written yet."}</p>
              <div className="mt-3 h-1.5 bg-forest-soft">
                <div className="h-1.5 bg-forest" style={{ width: `${project.progress.percent}%` }} />
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                {project.progress.completed} complete · {project.progress.open} open · {project.progress.estimatedRemaining}m remaining
              </p>
            </Link>
          ))}
        </div>
        <Panel title="New project">
          <form action={createProjectAction} className="space-y-3">
            <input type="hidden" name="spaceId" value={current?.id} />
            <Field label="Name">
              <input className={fieldClass} name="name" required />
            </Field>
            <Field label="Outcome">
              <textarea className={`${fieldClass} min-h-24 py-2`} name="outcome" />
            </Field>
            <Button type="submit">Create project</Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
