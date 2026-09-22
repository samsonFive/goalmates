import { prisma } from "@/lib/db";
import { requireActor } from "@/lib/current";
import { resolveSpace } from "@/lib/space-query";
import { listTasks } from "@/lib/domain/tasks";
import { createTaskAction, requestTaskAction } from "@/lib/actions";
import { Button, Field, Panel, fieldClass } from "@/components/ui/primitives";
import { TaskRow } from "@/components/tasks/TaskRow";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ space?: string }>;
}) {
  const actor = await requireActor();
  const { current, spaces } = await resolveSpace(actor, (await searchParams).space);
  const tasks = current
    ? await listTasks(prisma, actor, { spaceId: current.id, status: ["open", "in_progress"] })
    : [];
  const members = current?.memberships ?? [];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-4xl text-forest-deep">Do</h1>
        <p className="text-ink-muted">Standalone tasks are first-class. Projects are optional.</p>
      </header>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Panel title="Open work">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </Panel>
        <div className="space-y-5">
          <Panel title="Add a task">
            <form action={createTaskAction} className="space-y-3">
              <input type="hidden" name="spaceId" value={current?.id} />
              <Field label="Title">
                <input className={fieldClass} name="title" required />
              </Field>
              <Field label="Estimate (min)">
                <input className={fieldClass} name="estimateMinutes" type="number" min={0} />
              </Field>
              <Field label="Due">
                <input className={fieldClass} name="dueAt" type="datetime-local" />
              </Field>
              <Field label="Relationship">
                <select className={fieldClass} name="projectMode" defaultValue="standalone">
                  <option value="standalone">Standalone</option>
                  <option value="existing">Attach to project later from the project page</option>
                </select>
              </Field>
              {current?.type === "shared" ? (
                <Field label="Collaboration">
                  <select className={fieldClass} name="collaborationState" defaultValue="pool">
                    <option value="pool">Shared pool</option>
                    <option value="claimed">Claimed by me</option>
                    <option value="collaborative">Together</option>
                  </select>
                </Field>
              ) : (
                <input type="hidden" name="collaborationState" value="personal" />
              )}
              <Button type="submit">Save task</Button>
            </form>
          </Panel>
          {current?.type === "shared" ? (
            <Panel title="Lightweight ask">
              <form action={requestTaskAction} className="space-y-3">
                <input type="hidden" name="spaceId" value={current.id} />
                <Field label="Need">
                  <input className={fieldClass} name="title" placeholder="Grab Pepsi next store run" required />
                </Field>
                <Field label="Ask">
                  <select className={fieldClass} name="assigneeId" required>
                    {members
                      .filter((member) => member.userId !== actor.id)
                      .map((member) => (
                        <option key={member.userId} value={member.userId}>
                          {member.user.name}
                        </option>
                      ))}
                  </select>
                </Field>
                <input type="hidden" name="context" value="errand" />
                <Button type="submit" variant="secondary">
                  Send ask
                </Button>
              </form>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
