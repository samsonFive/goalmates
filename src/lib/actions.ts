"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireActor } from "@/lib/current";
import { signIn, signOut } from "@/lib/auth";
import { createSharedSpace, createUserWithPersonalSpace, inviteToSpace } from "@/lib/domain/spaces";
import { claimTask, createTask, releaseTask, requestTask, updateTask } from "@/lib/domain/tasks";
import { addWorkspaceBlock, createProject } from "@/lib/domain/projects";
import { scheduleTask } from "@/lib/domain/calendar";
import { completeRitual, createRitual, ensureDefaultRituals } from "@/lib/domain/rituals";
import { finishFocus, startFocus } from "@/lib/domain/focus";
import {
  createCaptureRecord,
  reconcileCapture,
  type ReconcileDecision,
} from "@/lib/domain/capture";
import { processCapture } from "@/lib/jobs/process-capture";
import { storage } from "@/lib/providers/storage";
import { DomainError, type RitualKind } from "@/lib/domain/types";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalDate(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function registerAction(formData: FormData): Promise<void> {
  const name = formString(formData, "name");
  const email = formString(formData, "email").toLowerCase();
  const password = formString(formData, "password");
  if (!name || !email || password.length < 8) {
    throw new DomainError("Name, email, and an 8+ character password are required.");
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new DomainError("That email already has an account.");
  await createUserWithPersonalSpace(prisma, {
    name,
    email,
    passwordHash: await hash(password, 10),
  });
  await signIn("credentials", { email, password, redirectTo: "/home" });
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = formString(formData, "email");
  const password = formString(formData, "password");
  try {
    await signIn("credentials", { email, password, redirectTo: "/home" });
  } catch (error) {
    const digest =
      typeof error === "object" && error && "digest" in error
        ? String((error as { digest?: string }).digest)
        : "";
    if (digest.startsWith("NEXT_REDIRECT")) throw error;
    redirect("/login?error=1");
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function createSpaceAction(formData: FormData) {
  const actor = await requireActor();
  const space = await createSharedSpace(prisma, actor, formString(formData, "name"));
  await ensureDefaultRituals(prisma, space.id);
  revalidatePath("/");
  redirect(`/home?space=${space.id}`);
}

export async function inviteAction(formData: FormData): Promise<void> {
  const actor = await requireActor();
  await inviteToSpace(
    prisma,
    actor,
    formString(formData, "spaceId"),
    formString(formData, "email"),
  );
  revalidatePath("/spaces");
}

export async function createTaskAction(formData: FormData) {
  const actor = await requireActor();
  const projectMode = formString(formData, "projectMode") || "standalone";
  let projectId = formString(formData, "projectId") || null;
  if (projectMode === "create") {
    const project = await createProject(prisma, actor, {
      spaceId: formString(formData, "spaceId"),
      name: formString(formData, "newProjectName") || formString(formData, "title"),
    });
    projectId = project.id;
  }
  const collaboration = formString(formData, "collaborationState");
  await createTask(prisma, actor, {
    spaceId: formString(formData, "spaceId"),
    title: formString(formData, "title"),
    description: formString(formData, "description") || null,
    projectId: projectMode === "standalone" ? null : projectId,
    estimateMinutes: Number(formData.get("estimateMinutes") || 0) || null,
    dueAt: optionalDate(formString(formData, "dueAt")),
    context: formString(formData, "context") || null,
    collaborationState: collaboration
      ? (collaboration as "personal" | "pool" | "requested" | "claimed" | "collaborative")
      : undefined,
    assigneeId: formString(formData, "assigneeId") || null,
  });
  revalidatePath("/home");
  revalidatePath("/plan");
  revalidatePath("/tasks");
}

export async function completeTaskAction(formData: FormData) {
  const actor = await requireActor();
  await updateTask(prisma, actor, formString(formData, "taskId"), { status: "completed" });
  revalidatePath("/home");
  revalidatePath("/tasks");
}

export async function claimTaskAction(formData: FormData) {
  const actor = await requireActor();
  await claimTask(prisma, actor, formString(formData, "taskId"));
  revalidatePath("/home");
  revalidatePath("/plan");
}

export async function releaseTaskAction(formData: FormData) {
  const actor = await requireActor();
  await releaseTask(prisma, actor, formString(formData, "taskId"));
  revalidatePath("/home");
}

export async function requestTaskAction(formData: FormData) {
  const actor = await requireActor();
  await requestTask(prisma, actor, {
    spaceId: formString(formData, "spaceId"),
    title: formString(formData, "title"),
    assigneeId: formString(formData, "assigneeId"),
    context: formString(formData, "context") || "errand",
    estimateMinutes: Number(formData.get("estimateMinutes") || 0) || undefined,
  });
  revalidatePath("/home");
  revalidatePath("/tasks");
}

export async function createProjectAction(formData: FormData) {
  const actor = await requireActor();
  const project = await createProject(prisma, actor, {
    spaceId: formString(formData, "spaceId"),
    name: formString(formData, "name"),
    outcome: formString(formData, "outcome") || null,
    targetAt: optionalDate(formString(formData, "targetAt")),
  });
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function addBlockAction(formData: FormData) {
  const actor = await requireActor();
  await addWorkspaceBlock(prisma, actor, {
    projectId: formString(formData, "projectId"),
    type: formString(formData, "type") || "rich_text",
    title: formString(formData, "title") || undefined,
    content: formString(formData, "content"),
  });
  revalidatePath(`/projects/${formString(formData, "projectId")}`);
}

export async function scheduleTaskAction(formData: FormData): Promise<void> {
  const actor = await requireActor();
  const startAt = optionalDate(formString(formData, "startAt"));
  const minutes = Number(formData.get("minutes") || 45);
  if (!startAt) throw new DomainError("Choose a start time.");
  await scheduleTask(prisma, actor, {
    taskId: formString(formData, "taskId"),
    startAt,
    endAt: new Date(startAt.getTime() + minutes * 60000),
  });
  revalidatePath("/plan");
  revalidatePath("/home");
}

export async function startFocusAction(formData: FormData) {
  const actor = await requireActor();
  const session = await startFocus(prisma, actor, {
    spaceId: formString(formData, "spaceId"),
    taskId: formString(formData, "taskId") || null,
    intention: formString(formData, "intention") || null,
    plannedMinutes: Number(formData.get("plannedMinutes") || 25),
  });
  redirect(`/focus/${session.id}`);
}

export async function finishFocusAction(formData: FormData) {
  const actor = await requireActor();
  await finishFocus(prisma, actor, {
    sessionId: formString(formData, "sessionId"),
    actualMinutes: Number(formData.get("actualMinutes") || 0),
    outcome: (formString(formData, "outcome") || "left_open") as "completed" | "left_open" | "abandoned",
    notes: formString(formData, "notes") || null,
    completeTask: formString(formData, "completeTask") === "yes",
  });
  revalidatePath("/home");
  redirect("/home");
}

export async function completeRitualAction(formData: FormData) {
  const actor = await requireActor();
  const answers: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("answer-")) answers[key.replace("answer-", "")] = String(value);
  }
  await completeRitual(prisma, actor, formString(formData, "ritualId"), answers);
  revalidatePath("/home");
  revalidatePath("/review");
}

export async function createRitualAction(formData: FormData) {
  const actor = await requireActor();
  await createRitual(prisma, actor, {
    spaceId: formString(formData, "spaceId"),
    name: formString(formData, "name"),
    kind: (formString(formData, "kind") || "custom") as RitualKind,
    cadence: formString(formData, "cadence") || "weekly",
  });
  revalidatePath("/rituals");
}

export async function captureTextAction(formData: FormData) {
  const actor = await requireActor();
  const capture = await createCaptureRecord(prisma, actor, {
    spaceId: formString(formData, "spaceId"),
    sourceType: "text",
    textInput: formString(formData, "text"),
  });
  await processCapture(capture.id, actor);
  redirect(`/capture/${capture.id}`);
}

export async function captureImageAction(formData: FormData): Promise<void> {
  const actor = await requireActor();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new DomainError("Choose an image or document to capture.");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const key = await storage.put(bytes, { mimeType: file.type, originalName: file.name });
  const capture = await createCaptureRecord(prisma, actor, {
    spaceId: formString(formData, "spaceId"),
    sourceType: file.type === "application/pdf" ? "document" : "image",
    storageKey: key,
    mimeType: file.type,
    originalName: file.name,
  });
  await processCapture(capture.id, actor);
  redirect(`/capture/${capture.id}`);
}

export async function retryCaptureAction(formData: FormData) {
  const actor = await requireActor();
  await processCapture(formString(formData, "captureId"), actor);
  revalidatePath(`/capture/${formString(formData, "captureId")}`);
}

export async function reconcileAction(formData: FormData) {
  const actor = await requireActor();
  const captureId = formString(formData, "captureId");
  const raw = JSON.parse(formString(formData, "decisions") || "[]") as ReconcileDecision[];
  const decisions = raw.map((decision) => ({
    ...decision,
    dueAt: decision.dueAt ? new Date(decision.dueAt) : null,
  }));
  await reconcileCapture(prisma, actor, captureId, decisions);
  revalidatePath("/home");
  redirect("/plan");
}
