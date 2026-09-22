"use client";

import { useEffect, useMemo, useState } from "react";
import { finishFocusAction } from "@/lib/actions";
import { Button, fieldClass } from "@/components/ui/primitives";

export function FocusTimer({
  sessionId,
  plannedMinutes,
  startedAt,
  title,
  hasTask,
}: {
  sessionId: string;
  plannedMinutes: number;
  startedAt: string;
  title: string;
  hasTask: boolean;
}) {
  const start = useMemo(() => new Date(startedAt).getTime(), [startedAt]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const elapsed = Math.max(0, Math.floor((now - start) / 1000));
  const remaining = plannedMinutes * 60 - elapsed;
  const display = remaining >= 0 ? remaining : elapsed;
  const minutes = Math.floor(display / 60);
  const seconds = display % 60;
  const actualMinutes = Math.max(1, Math.round(elapsed / 60));

  return (
    <div className="gm-panel p-6 text-center">
      <p className="text-xs uppercase tracking-[0.16em] text-brass">{title}</p>
      <p className="mt-4 font-display text-7xl text-forest-deep">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </p>
      <p className="mt-2 text-sm text-ink-muted">
        {remaining >= 0 ? "remaining" : "over the planned window — keep going if it is useful"}
      </p>
      <form action={finishFocusAction} className="mx-auto mt-6 max-w-md space-y-3 text-left">
        <input type="hidden" name="sessionId" value={sessionId} />
        <input type="hidden" name="actualMinutes" value={actualMinutes} />
        <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Outcome
          <select className={`${fieldClass} mt-1`} name="outcome" defaultValue="left_open">
            <option value="left_open">Leave the work open</option>
            <option value="completed">Session done</option>
            <option value="abandoned">Stop early</option>
          </select>
        </label>
        {hasTask ? (
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name="completeTask" value="yes" />
            Mark the task complete
          </label>
        ) : null}
        <textarea className={`${fieldClass} min-h-20 py-2`} name="notes" placeholder="What moved?" />
        <Button type="submit">End session</Button>
      </form>
    </div>
  );
}
