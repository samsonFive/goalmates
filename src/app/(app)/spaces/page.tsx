import { prisma } from "@/lib/db";
import { requireActor } from "@/lib/current";
import { listSpaces } from "@/lib/domain/spaces";
import { createSpaceAction, inviteAction } from "@/lib/actions";
import { Button, Field, Panel, fieldClass } from "@/components/ui/primitives";

export default async function SpacesPage() {
  const actor = await requireActor();
  const spaces = await listSpaces(prisma, actor);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-4xl text-forest-deep">Spaces</h1>
        <p className="text-ink-muted">Private work stays private. Shared GoalMate spaces are explicit.</p>
      </header>
      <div className="grid gap-4">
        {spaces.map((space) => (
          <section key={space.id} className="gm-panel p-4">
            <h2 className="font-display text-2xl">{space.name}</h2>
            <p className="text-sm text-ink-muted">{space.type === "personal" ? "Private" : "Shared"}</p>
            <ul className="mt-2 text-sm">
              {space.memberships.map((member) => (
                <li key={member.id}>
                  {member.user.name} · {member.role}
                </li>
              ))}
            </ul>
            {space.type === "shared" ? (
              <form action={inviteAction} className="mt-4 flex flex-wrap gap-2">
                <input type="hidden" name="spaceId" value={space.id} />
                <input className={fieldClass} name="email" placeholder="teammate@email" required />
                <Button type="submit" variant="secondary">
                  Invite existing account
                </Button>
              </form>
            ) : null}
          </section>
        ))}
      </div>
      <Panel title="Create a shared GoalMate space">
        <form action={createSpaceAction} className="space-y-3">
          <Field label="Household or team name">
            <input className={fieldClass} name="name" required />
          </Field>
          <Button type="submit">Create shared space</Button>
        </form>
      </Panel>
    </div>
  );
}
