import Link from "next/link";
import { Camera, CalendarDays, Home, ListTodo, MoreHorizontal } from "lucide-react";
import { logoutAction } from "@/lib/actions";
import type { Actor } from "@/lib/domain/types";
import { SpaceSwitcher } from "./SpaceSwitcher";

const NAV = [
  { href: "/home", label: "Now", icon: Home },
  { href: "/plan", label: "Plan", icon: CalendarDays },
  { href: "/capture", label: "Capture", icon: Camera },
  { href: "/tasks", label: "Do", icon: ListTodo },
  { href: "/review", label: "Review", icon: MoreHorizontal },
];

export function AppShell({
  actor,
  spaces,
  currentSpaceId,
  children,
}: {
  actor: Actor;
  spaces: { id: string; name: string; type: string }[];
  currentSpaceId?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-paper-rule bg-forest-deep text-paper-raised lg:flex lg:flex-col">
        <div className="px-5 pb-6 pt-7">
          <p className="font-display text-2xl">GoalMates</p>
          <p className="mt-1 text-xs text-forest-soft">Capture → Plan → Do → Review</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-11 items-center gap-3 rounded-gm px-3 text-sm text-forest-soft hover:bg-white/10 hover:text-white"
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
          <Link className="flex min-h-11 items-center gap-3 rounded-gm px-3 text-sm text-forest-soft hover:bg-white/10" href="/projects">
            Projects
          </Link>
          <Link className="flex min-h-11 items-center gap-3 rounded-gm px-3 text-sm text-forest-soft hover:bg-white/10" href="/opportunity">
            Opportunity
          </Link>
          <Link className="flex min-h-11 items-center gap-3 rounded-gm px-3 text-sm text-forest-soft hover:bg-white/10" href="/rituals">
            Rituals
          </Link>
          <Link className="flex min-h-11 items-center gap-3 rounded-gm px-3 text-sm text-forest-soft hover:bg-white/10" href="/spaces">
            Spaces
          </Link>
        </nav>
        <form action={logoutAction} className="border-t border-white/10 p-4">
          <p className="text-sm">{actor.name}</p>
          <button className="mt-2 text-xs text-brass-soft underline" type="submit">
            Sign out
          </button>
        </form>
      </aside>

      <div className="flex min-h-dvh flex-col pb-20 lg:pb-0">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-paper-rule bg-paper/95 px-4 py-3 backdrop-blur">
          <div>
            <p className="font-display text-lg text-forest-deep lg:hidden">GoalMates</p>
            <p className="hidden text-xs uppercase tracking-[0.16em] text-ink-muted lg:block">Workbench</p>
          </div>
          <SpaceSwitcher spaces={spaces} currentSpaceId={currentSpaceId} />
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 lg:px-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-paper-rule bg-paper-raised lg:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-forest"
          >
            <item.icon size={20} />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
