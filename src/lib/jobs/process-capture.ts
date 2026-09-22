import { prisma } from "@/lib/db";
import { attachCandidates, markCaptureFailed } from "@/lib/domain/capture";
import type { Actor } from "@/lib/domain/types";
import { interpretExtractedText } from "@/lib/providers/interpret";
import { selectVisionProvider } from "@/lib/providers/vision";
import { storage } from "@/lib/providers/storage";

export async function processCapture(captureId: string, actor: Actor) {
  const capture = await prisma.capture.findUnique({ where: { id: captureId } });
  if (!capture) return;

  await prisma.capture.update({
    where: { id: captureId },
    data: { status: "processing", processingError: null },
  });

  try {
    let bytes: Buffer | undefined;
    if (capture.storageKey) {
      bytes = await storage.get(capture.storageKey);
    }
    const provider = selectVisionProvider(capture.sourceType);
    const extracted = await provider.extract({
      bytes,
      mimeType: capture.mimeType ?? undefined,
      text: capture.textInput ?? undefined,
    });

    if (!extracted.text) {
      await markCaptureFailed(
        prisma,
        captureId,
        extracted.provider,
        extracted.message ?? "No text could be extracted. The source is still saved.",
      );
      return;
    }

    const drafts = interpretExtractedText(extracted.text);
    await attachCandidates(prisma, actor, captureId, drafts, extracted.provider, extracted.text);
  } catch (error) {
    await markCaptureFailed(
      prisma,
      captureId,
      "processor",
      error instanceof Error ? error.message : "Capture processing failed.",
    );
  }
}
