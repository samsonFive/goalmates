import Link from "next/link";
import { claimTaskAction, completeTaskAction, releaseTaskAction } from "@/lib/actions";
import { Button } from "@/components/ui/primitives";

type TaskRowData = {
  id: string;
  title: string;
  status: string;
  estimateMinutes: number | null;
  collaborationState: string;
  context: string | null;
  project?: { name: string } | null;
  owner?: { name: string } | null;
  claimant?: { name: string } | null;
  requester?: { name: string } | null;
  assignee?: { name: string } | null;
};

export function TaskRow({ task, compact = false }: { task: TaskRowData; compact?: boolean }) {
  return (
    <article className="flex flex-wrap items-center gap-3 border-b border-paper-rule py-3 last:border-b-0">
      <form action={completeTaskAction}>
        <input type="hidden" name="taskId" value={task.id} />
        <button
          className="h-7 w-7 rounded-full border border-forest-mid text-forest"
          aria-label={`Complete ${task.title}`}
          disabled={task.status === "completed"}
        >
          {task.status === "completed" ? "✓" : ""}
        </button>
      </form>
      <div className="min-w-0 flex-1">
        <Link href={`/tasks/${task.id}`} className="font-medium text-ink hover:underline">
          {task.title}
        </Link>
        <p className="text-xs text-ink-muted">
          {task.project ? task.project.name : "Standalone"}
          {task.estimateMinutes ? ` · ${task.estimateMinutes}m` : ""}
          {task.collaborationState !== "personal" ? ` · ${task.collaborationState}` : ""}
          {task.context ? ` · ${task.context}` : ""}
          {task.claimant ? ` · ${task.claimant.name}` : ""}
          {task.assignee ? ` · for ${task.assignee.name}` : ""}
        </p>
      </div>
      {!compact && task.collaborationState === "pool" ? (
        <form action={claimTaskAction}>
          <input type="hidden" name="taskId" value={task.id} />
          <Button type="submit" variant="secondary">
            I'll take this
          </Button>
        </form>
      ) : null}
      {!compact && task.collaborationState === "claimed" ? (
        <form action={releaseTaskAction}>
          <input type="hidden" name="taskId" value={task.id} />
          <Button type="submit" variant="ghost">
            Return to pool
          </Button>
        </form>
      ) : null}
    </article>
  );
}
