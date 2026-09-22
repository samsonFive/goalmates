import type { DbClient } from "@/lib/db";
import { requireMembership } from "./authz";
import { DomainError, type Actor } from "./types";
import { recordActivity } from "./activity";

export async function createProject(
  db: DbClient,
  actor: Actor,
  input: {
    spaceId: string;
    name: string;
    outcome?: string | null;
    targetAt?: Date | null;
    reviewCadence?: string | null;
  },
) {
  await requireMembership(db, actor, input.spaceId);
  const name = input.name.trim();
  if (!name) throw new DomainError("A project needs a name.");

  const project = await db.project.create({
    data: {
      spaceId: input.spaceId,
      name,
      outcome: input.outcome ?? null,
      targetAt: input.targetAt ?? null,
      reviewCadence: input.reviewCadence ?? "weekly",
      participants: { create: { userId: actor.id, role: "owner" } },
    },
  });
  await recordActivity(db, {
    spaceId: input.spaceId,
    actorId: actor.id,
    type: "project.created",
    entityType: "project",
    entityId: project.id,
    payload: { name },
  });
  return project;
}

export function projectProgress(tasks: { status: string; estimateMinutes: number | null }[]) {
  const actionable = tasks.filter((task) => task.status !== "archived");
  if (actionable.length === 0) {
    return { percent: 0, open: 0, completed: 0, estimatedRemaining: 0 };
  }
  const completed = actionable.filter((task) => task.status === "completed");
  const open = actionable.filter((task) => task.status !== "completed");
  const weight = (task: { estimateMinutes: number | null }) => task.estimateMinutes ?? 30;
  const doneWeight = completed.reduce((sum, task) => sum + weight(task), 0);
  const totalWeight = actionable.reduce((sum, task) => sum + weight(task), 0);
  return {
    percent: Math.round((doneWeight / totalWeight) * 100),
    open: open.length,
    completed: completed.length,
    estimatedRemaining: open.reduce((sum, task) => sum + (task.estimateMinutes ?? 0), 0),
  };
}

export async function listProjects(db: DbClient, actor: Actor, spaceId?: string) {
  if (spaceId) await requireMembership(db, actor, spaceId);
  const projects = await db.project.findMany({
    where: spaceId
      ? { spaceId }
      : { space: { memberships: { some: { userId: actor.id } } } },
    include: {
      space: true,
      tasks: true,
      participants: { include: { user: { select: { id: true, name: true } } } },
      blocks: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return projects.map((project) => ({
    ...project,
    progress: projectProgress(project.tasks),
  }));
}

export async function getProject(db: DbClient, actor: Actor, projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      space: true,
      tasks: {
        include: {
          owner: { select: { id: true, name: true } },
          claimant: { select: { id: true, name: true } },
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      },
      participants: { include: { user: { select: { id: true, name: true } } } },
      blocks: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!project) throw new DomainError("Project not found.");
  await requireMembership(db, actor, project.spaceId);
  return { ...project, progress: projectProgress(project.tasks) };
}

export async function addWorkspaceBlock(
  db: DbClient,
  actor: Actor,
  input: { projectId: string; type: string; title?: string; content: string },
) {
  const project = await db.project.findUnique({ where: { id: input.projectId } });
  if (!project) throw new DomainError("Project not found.");
  await requireMembership(db, actor, project.spaceId);
  const last = await db.workspaceBlock.findFirst({
    where: { projectId: input.projectId },
    orderBy: { sortOrder: "desc" },
  });
  return db.workspaceBlock.create({
    data: {
      projectId: input.projectId,
      type: input.type,
      title: input.title ?? null,
      content: input.content,
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });
}
