import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/providers/storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const { id } = await context.params;
  const capture = await prisma.capture.findUnique({ where: { id } });
  if (!capture?.storageKey) return new Response("Not found", { status: 404 });
  const membership = await prisma.membership.findUnique({
    where: { userId_spaceId: { userId: session.user.id, spaceId: capture.spaceId } },
  });
  if (!membership) return new Response("Forbidden", { status: 403 });
  const bytes = await storage.get(capture.storageKey);
  return new Response(Uint8Array.from(bytes), {
    headers: {
      "Content-Type": capture.mimeType || "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
