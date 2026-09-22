import { prisma } from "@/lib/db";
import { requireActor } from "@/lib/current";
import { getCapture } from "@/lib/domain/capture";
import { listProjects } from "@/lib/domain/projects";
import { captureTextAction, retryCaptureAction } from "@/lib/actions";
import { ReconcileBoard } from "@/components/capture/ReconcileBoard";
import { Button, Panel, fieldClass } from "@/components/ui/primitives";

export default async function CaptureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireActor();
  const { id } = await params;
  const capture = await getCapture(prisma, actor, id);
  const projects = await listProjects(prisma, actor, capture.spaceId);
  const candidates = capture.candidates.map((candidate) => ({
    ...candidate,
    dueAt: candidate.dueAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-5">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">Reconciliation</p>
        <h1 className="font-display text-4xl text-forest-deep">Review extracted items</h1>
        <p className="mt-2 text-ink-muted">
          Status: {capture.status}
          {capture.provider ? ` · ${capture.provider}` : ""}
        </p>
      </header>

      {capture.status === "failed" ? (
        <Panel title="Capture did not invent any items">
          <p className="text-sm text-ink-muted">
            {capture.processingError || "The source was stored, but extraction failed."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <form action={retryCaptureAction}>
              <input type="hidden" name="captureId" value={capture.id} />
              <Button type="submit">Retry extraction</Button>
            </form>
          </div>
          <form action={captureTextAction} className="mt-5 space-y-3">
            <input type="hidden" name="spaceId" value={capture.spaceId} />
            <textarea
              name="text"
              className={`${fieldClass} min-h-28 py-2`}
              placeholder="Type the items you can see on the source."
              required
            />
            <Button type="submit" variant="secondary">
              Create a manual capture from this source
            </Button>
          </form>
        </Panel>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Source">
          {capture.storageKey ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/captures/${capture.id}/file`}
              alt={capture.originalName || "Captured source"}
              className="max-h-[70vh] w-full rounded-gm object-contain"
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-ink-muted">{capture.textInput || capture.rawExtraction}</pre>
          )}
          {capture.rawExtraction ? (
            <details className="mt-3 text-xs text-ink-muted">
              <summary>Extracted text</summary>
              <pre className="mt-2 whitespace-pre-wrap">{capture.rawExtraction}</pre>
            </details>
          ) : null}
        </Panel>
        <div>
          {candidates.length > 0 ? (
            <ReconcileBoard
              captureId={capture.id}
              candidates={candidates}
              projects={projects.map((project) => ({ id: project.id, name: project.name }))}
            />
          ) : capture.status !== "failed" ? (
            <Panel title="Still processing or empty">
              <p className="text-sm text-ink-muted">If this stays empty, retry or enter items manually.</p>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
