import { prisma } from "@/lib/db";
import { requireActor } from "@/lib/current";
import { suggestOpportunities } from "@/lib/domain/opportunities";
import { startFocus } from "@/lib/domain/focus";
import { Button, Field, Panel, fieldClass } from "@/components/ui/primitives";
import { redirect } from "next/navigation";

export default async function OpportunityPage({
  searchParams,
}: {
  searchParams: Promise<{ minutes?: string; energy?: string; context?: string }>;
}) {
  const actor = await requireActor();
  const params = await searchParams;
  const minutes = Number(params.minutes || 45);
  const suggestions = await suggestOpportunities(prisma, actor, {
    minutes,
    energy: (params.energy as "low" | "medium" | "high") || undefined,
    context: params.context || undefined,
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-4xl text-forest-deep">I have some time</h1>
        <p className="text-ink-muted">Offers, not assignments. Ignore anything that is not useful.</p>
      </header>
      <Panel title="Window">
        <form className="grid gap-3 md:grid-cols-4">
          <Field label="Minutes">
            <input className={fieldClass} name="minutes" defaultValue={minutes} />
          </Field>
          <Field label="Energy">
            <select className={fieldClass} name="energy" defaultValue={params.energy || ""}>
              <option value="">Any</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
          <Field label="Context">
            <input className={fieldClass} name="context" defaultValue={params.context || ""} placeholder="errand, home..." />
          </Field>
          <Button type="submit" className="self-end">
            Suggest
          </Button>
        </form>
      </Panel>
      <div className="space-y-3">
        {suggestions.map((item) => (
          <article key={item.taskId} className="gm-panel flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <h2 className="font-display text-2xl">{item.title}</h2>
              <p className="text-sm text-ink-muted">
                {item.estimateMinutes ?? "?"}m · {item.spaceName}
                {item.projectName ? ` · ${item.projectName}` : ""}
              </p>
              <p className="text-xs text-ink-faint">{item.reason}</p>
            </div>
            <form action={startSuggestedFocus}>
              <input type="hidden" name="taskId" value={item.taskId} />
              <input type="hidden" name="plannedMinutes" value={item.estimateMinutes ?? minutes} />
              <Button type="submit" variant="secondary">
                Start
              </Button>
            </form>
          </article>
        ))}
        {suggestions.length === 0 ? (
          <p className="text-ink-muted">Nothing obvious fits this window. That is fine — rest is a valid use of time.</p>
        ) : null}
      </div>
    </div>
  );
}

async function startSuggestedFocus(formData: FormData) {
  "use server";
  const actor = await requireActor();
  const task = await prisma.task.findUnique({ where: { id: String(formData.get("taskId")) } });
  if (!task) return;
  const session = await startFocus(prisma, actor, {
    spaceId: task.spaceId,
    taskId: task.id,
    plannedMinutes: Number(formData.get("plannedMinutes") || 25),
  });
  redirect(`/focus/${session.id}`);
}
