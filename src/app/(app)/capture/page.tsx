import { prisma } from "@/lib/db";
import { requireActor } from "@/lib/current";
import { resolveSpace } from "@/lib/space-query";
import { listCaptures } from "@/lib/domain/capture";
import { captureImageAction, captureTextAction } from "@/lib/actions";
import { Button, Field, Panel, fieldClass } from "@/components/ui/primitives";
import Link from "next/link";
import { format } from "date-fns";

export default async function CapturePage({
  searchParams,
}: {
  searchParams: Promise<{ space?: string }>;
}) {
  const actor = await requireActor();
  const { current } = await resolveSpace(actor, (await searchParams).space);
  const captures = await listCaptures(prisma, actor, current?.id);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">Front door</p>
        <h1 className="font-display text-4xl text-forest-deep">Capture</h1>
        <p className="mt-2 max-w-2xl text-ink-muted">
          Photograph a planner, upload a page, or type a scratch list. GoalMates proposes items; you decide what becomes
          durable work. Nothing is created until you reconcile.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Photo or document">
          <form action={captureImageAction} className="space-y-3">
            <input type="hidden" name="spaceId" value={current?.id} />
            <Field label="Image or PDF">
              <input className={fieldClass} name="file" type="file" accept="image/*,.pdf" required />
            </Field>
            <Button type="submit">Process capture</Button>
            <p className="text-xs text-ink-muted">
              Local OCR runs without an AI key. If extraction fails, the source stays saved and you can enter items by
              hand.
            </p>
          </form>
        </Panel>
        <Panel title="Typed list">
          <form action={captureTextAction} className="space-y-3">
            <input type="hidden" name="spaceId" value={current?.id} />
            <Field label="Notes">
              <textarea name="text" required className={`${fieldClass} min-h-36 py-2`} />
            </Field>
            <Button type="submit">Extract items</Button>
          </form>
        </Panel>
      </div>

      <Panel title="Recent captures">
        <ul className="divide-y divide-paper-rule">
          {captures.map((capture) => (
            <li key={capture.id} className="flex items-center justify-between py-3">
              <div>
                <Link className="font-semibold hover:underline" href={`/capture/${capture.id}`}>
                  {capture.originalName || capture.sourceType} · {capture.status}
                </Link>
                <p className="text-xs text-ink-muted">
                  {format(capture.createdAt, "MMM d, h:mm a")} · {capture.candidates.length} proposed
                </p>
              </div>
              <span className="text-xs uppercase tracking-wider text-ink-faint">{capture.space.name}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
