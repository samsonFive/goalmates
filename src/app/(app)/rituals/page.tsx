import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireActor } from "@/lib/current";
import { resolveSpace } from "@/lib/space-query";
import { createRitualAction } from "@/lib/actions";
import { ensureDefaultRituals, listRituals } from "@/lib/domain/rituals";
import { Button, Field, Panel, fieldClass } from "@/components/ui/primitives";

export default async function RitualsPage({
  searchParams,
}: {
  searchParams: Promise<{ space?: string }>;
}) {
  const actor = await requireActor();
  const { current } = await resolveSpace(actor, (await searchParams).space);
  if (current) await ensureDefaultRituals(prisma, current.id);
  const rituals = await listRituals(prisma, actor, current?.id);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-4xl text-forest-deep">Rituals</h1>
        <p className="text-ink-muted">Recurring planning process — not ordinary tasks wearing a label.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {rituals.map((ritual) => (
          <Link key={ritual.id} href={`/rituals/${ritual.id}`} className="gm-panel p-4 hover:border-forest-mid">
            <p className="text-[11px] uppercase tracking-[0.14em] text-brass">{ritual.cadence}</p>
            <h2 className="font-display text-2xl">{ritual.name}</h2>
            <p className="text-sm text-ink-muted">{ritual.space.name}</p>
          </Link>
        ))}
      </div>
      <Panel title="Custom ritual">
        <form action={createRitualAction} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="spaceId" value={current?.id} />
          <Field label="Name">
            <input className={fieldClass} name="name" required />
          </Field>
          <Field label="Cadence">
            <select className={fieldClass} name="cadence" defaultValue="weekly">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </Field>
          <input type="hidden" name="kind" value="custom" />
          <Button type="submit">Add ritual</Button>
        </form>
      </Panel>
    </div>
  );
}
