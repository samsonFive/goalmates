import { prisma } from "@/lib/db";
import { requireActor } from "@/lib/current";
import { getProject } from "@/lib/domain/projects";
import { addBlockAction, createTaskAction } from "@/lib/actions";
import { Button, Field, Panel, fieldClass } from "@/components/ui/primitives";
import { TaskRow } from "@/components/tasks/TaskRow";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const project = await getProject(prisma, actor, (await params).id);
  const open = project.tasks.filter((task) => task.status !== "completed" && task.status !== "archived");
  const done = project.tasks.filter((task) => task.status === "completed");

  return (
    <div className="space-y-5">
      <header>
        <p className="text-[11px] uppercase tracking-[0.16em] text-brass">{project.space.name}</p>
        <h1 className="font-display text-4xl text-forest-deep">{project.name}</h1>
        <p className="mt-2 max-w-2xl text-ink-muted">{project.outcome}</p>
        <div className="mt-4 h-2 max-w-md bg-forest-soft">
          <div className="h-2 bg-forest" style={{ width: `${project.progress.percent}%` }} />
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          {project.progress.percent}% from estimated work · {project.participants.map((p) => p.user.name).join(", ")}
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Panel title="Structured work">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">Open</h3>
          {open.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
          <h3 className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">Completed</h3>
          {done.map((task) => (
            <TaskRow key={task.id} task={task} compact />
          ))}
          <form action={createTaskAction} className="mt-5 space-y-2 border-t border-paper-rule pt-4">
            <input type="hidden" name="spaceId" value={project.spaceId} />
            <input type="hidden" name="projectMode" value="existing" />
            <input type="hidden" name="projectId" value={project.id} />
            <Field label="Add a task">
              <input className={fieldClass} name="title" required />
            </Field>
            <Field label="Estimate">
              <input className={fieldClass} name="estimateMinutes" type="number" />
            </Field>
            <Button type="submit">Add to project</Button>
          </form>
        </Panel>
        <Panel title="Context workspace">
          <div className="space-y-4">
            {project.blocks.map((block) => (
              <article key={block.id} className="border-b border-paper-rule pb-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-brass">{block.type}</p>
                <h3 className="font-display text-xl">{block.title}</h3>
                {block.type === "link" ? (
                  <a className="text-forest underline" href={block.content}>
                    {block.content}
                  </a>
                ) : (
                  <p className="whitespace-pre-wrap text-sm text-ink-muted">{block.content}</p>
                )}
              </article>
            ))}
          </div>
          <form action={addBlockAction} className="mt-5 space-y-3">
            <input type="hidden" name="projectId" value={project.id} />
            <Field label="Type">
              <select className={fieldClass} name="type" defaultValue="rich_text">
                <option value="rich_text">Note</option>
                <option value="decision">Decision</option>
                <option value="research">Research</option>
                <option value="link">Link</option>
                <option value="file">File reference</option>
              </select>
            </Field>
            <Field label="Title">
              <input className={fieldClass} name="title" />
            </Field>
            <Field label="Content">
              <textarea className={`${fieldClass} min-h-28 py-2`} name="content" required />
            </Field>
            <Button type="submit" variant="secondary">
              Add context
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
