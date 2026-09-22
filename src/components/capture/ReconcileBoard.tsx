"use client";

import { useMemo, useState } from "react";
import { reconcileAction } from "@/lib/actions";
import { Button, fieldClass } from "@/components/ui/primitives";

type Duplicate = {
  taskId: string;
  title: string;
  status: string;
  projectName: string | null;
  score: number;
  reason: string;
};

type Candidate = {
  id: string;
  kind: string;
  title: string;
  dueAt: string | null;
  estimateMinutes: number | null;
  confidence: number;
  projectHint: string | null;
  proposedProjectId: string | null;
  duplicateJson: string;
  evidence: string | null;
};

type Project = { id: string; name: string };

type Decision = {
  action: "accept" | "skip" | "merge" | "link";
  title: string;
  dueAt: string;
  estimateMinutes: string;
  kind: "task" | "event";
  projectMode: "standalone" | "existing" | "create";
  projectId: string;
  newProjectName: string;
  mergeTaskId: string;
};

function parseDuplicates(raw: string): Duplicate[] {
  try {
    return JSON.parse(raw) as Duplicate[];
  } catch {
    return [];
  }
}

export function ReconcileBoard({
  captureId,
  candidates,
  projects,
}: {
  captureId: string;
  candidates: Candidate[];
  projects: Project[];
}) {
  const initial = useMemo(() => {
    const map: Record<string, Decision> = {};
    for (const candidate of candidates) {
      const dups = parseDuplicates(candidate.duplicateJson);
      map[candidate.id] = {
        action: dups[0] && dups[0].score >= 0.86 ? "merge" : "accept",
        title: candidate.title,
        dueAt: candidate.dueAt ? candidate.dueAt.slice(0, 16) : "",
        estimateMinutes: candidate.estimateMinutes ? String(candidate.estimateMinutes) : "",
        kind: candidate.kind === "event" ? "event" : "task",
        projectMode: candidate.proposedProjectId ? "existing" : "standalone",
        projectId: candidate.proposedProjectId ?? "",
        newProjectName: candidate.projectHint ?? "",
        mergeTaskId: dups[0]?.taskId ?? "",
      };
    }
    return map;
  }, [candidates]);

  const [decisions, setDecisions] = useState(initial);

  function patch(id: string, next: Partial<Decision>) {
    setDecisions((current) => ({ ...current, [id]: { ...current[id], ...next } }));
  }

  const payload = candidates.map((candidate) => {
    const decision = decisions[candidate.id];
    return {
      candidateId: candidate.id,
      action: decision.action,
      title: decision.title,
      dueAt: decision.dueAt || null,
      estimateMinutes: decision.estimateMinutes ? Number(decision.estimateMinutes) : null,
      kind: decision.kind,
      projectMode: decision.projectMode,
      projectId: decision.projectId || null,
      newProjectName: decision.newProjectName || null,
      mergeTaskId: decision.mergeTaskId || null,
    };
  });

  return (
    <form action={reconcileAction} className="space-y-4">
      <input type="hidden" name="captureId" value={captureId} />
      <input type="hidden" name="decisions" value={JSON.stringify(payload)} />
      {candidates.map((candidate) => {
        const decision = decisions[candidate.id];
        const duplicates = parseDuplicates(candidate.duplicateJson);
        return (
          <article key={candidate.id} className="gm-panel space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-brass">
                  {candidate.kind} · {Math.round(candidate.confidence * 100)}% confidence
                </p>
                <input
                  className={`${fieldClass} mt-1 font-semibold`}
                  value={decision.title}
                  onChange={(event) => patch(candidate.id, { title: event.target.value })}
                />
                {candidate.evidence ? (
                  <p className="mt-1 text-xs text-ink-faint">Source: {candidate.evidence}</p>
                ) : null}
              </div>
              <select
                className={fieldClass}
                value={decision.action}
                onChange={(event) =>
                  patch(candidate.id, { action: event.target.value as Decision["action"] })
                }
              >
                <option value="accept">Accept</option>
                <option value="skip">Skip</option>
                <option value="merge">Merge into existing</option>
                <option value="link">Link to existing</option>
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs">
                Date / time
                <input
                  className={`${fieldClass} mt-1`}
                  type="datetime-local"
                  value={decision.dueAt}
                  onChange={(event) => patch(candidate.id, { dueAt: event.target.value })}
                />
              </label>
              <label className="text-xs">
                Estimate (min)
                <input
                  className={`${fieldClass} mt-1`}
                  value={decision.estimateMinutes}
                  onChange={(event) => patch(candidate.id, { estimateMinutes: event.target.value })}
                />
              </label>
              <label className="text-xs">
                Kind
                <select
                  className={`${fieldClass} mt-1`}
                  value={decision.kind}
                  onChange={(event) =>
                    patch(candidate.id, { kind: event.target.value as "task" | "event" })
                  }
                >
                  <option value="task">Task</option>
                  <option value="event">Event</option>
                </select>
              </label>
            </div>
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
                Project relationship
              </legend>
              <div className="flex flex-wrap gap-3 text-sm">
                {(["standalone", "existing", "create"] as const).map((mode) => (
                  <label key={mode} className="flex min-h-11 items-center gap-2">
                    <input
                      type="radio"
                      checked={decision.projectMode === mode}
                      onChange={() => patch(candidate.id, { projectMode: mode })}
                    />
                    {mode === "standalone" ? "Leave standalone" : mode === "existing" ? "Attach existing" : "Create project"}
                  </label>
                ))}
              </div>
              {decision.projectMode === "existing" ? (
                <select
                  className={fieldClass}
                  value={decision.projectId}
                  onChange={(event) => patch(candidate.id, { projectId: event.target.value })}
                >
                  <option value="">Choose project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              ) : null}
              {decision.projectMode === "create" ? (
                <input
                  className={fieldClass}
                  placeholder="New project name"
                  value={decision.newProjectName}
                  onChange={(event) => patch(candidate.id, { newProjectName: event.target.value })}
                />
              ) : null}
            </fieldset>
            {duplicates.length > 0 ? (
              <div className="border border-brass-soft bg-brass-soft/40 p-3 text-sm">
                <p className="font-semibold">Possible duplicate — you decide</p>
                {duplicates.map((dup) => (
                  <label key={dup.taskId} className="mt-2 flex items-start gap-2">
                    <input
                      type="radio"
                      checked={decision.mergeTaskId === dup.taskId}
                      onChange={() => patch(candidate.id, { mergeTaskId: dup.taskId, action: "merge" })}
                    />
                    <span>
                      {dup.title} ({dup.status}
                      {dup.projectName ? ` · ${dup.projectName}` : ""}) · {dup.reason}
                    </span>
                  </label>
                ))}
              </div>
            ) : null}
          </article>
        );
      })}
      <Button type="submit">Accept selected items</Button>
    </form>
  );
}
