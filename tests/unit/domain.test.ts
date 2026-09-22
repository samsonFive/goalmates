import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AuthzError } from "@/lib/domain/types";
import { createTask, claimTask, listTasks, requestTask } from "@/lib/domain/tasks";
import { createProject, getProject, projectProgress } from "@/lib/domain/projects";
import {
  attachCandidates,
  createCaptureRecord,
  getCapture,
  reconcileCapture,
} from "@/lib/domain/capture";
import { interpretExtractedText } from "@/lib/providers/interpret";
import { similarity, scoreDuplicate } from "@/lib/domain/duplicates";
import { completeRitual, createRitual, dueRituals } from "@/lib/domain/rituals";
import { suggestOpportunities } from "@/lib/domain/opportunities";
import { scheduleTask } from "@/lib/domain/calendar";
import { resetDb, twoPersonHousehold } from "./helpers";

const db = new PrismaClient();

beforeEach(async () => {
  await resetDb(db);
});

afterAll(async () => {
  await db.$disconnect();
});

describe("standalone tasks", () => {
  it("creates a task without a project", async () => {
    const { jordan } = await twoPersonHousehold(db);
    const task = await createTask(db, jordan.actor, {
      spaceId: jordan.space.id,
      title: "Call dentist",
      estimateMinutes: 15,
    });
    expect(task.projectId).toBeNull();
    expect(task.collaborationState).toBe("personal");
  });
});

describe("privacy", () => {
  it("does not let Sam read Jordan's private task through list or capture matching", async () => {
    const { jordan, sam, household } = await twoPersonHousehold(db);
    await createTask(db, jordan.actor, {
      spaceId: jordan.space.id,
      title: "Secret therapy intake",
    });
    const samTasks = await listTasks(db, sam.actor);
    expect(samTasks.map((task) => task.title)).not.toContain("Secret therapy intake");

    const capture = await createCaptureRecord(db, sam.actor, {
      spaceId: household.id,
      sourceType: "text",
      textInput: "Secret therapy intake",
    });
    const processed = await attachCandidates(
      db,
      sam.actor,
      capture.id,
      [{ kind: "task", title: "Secret therapy intake", confidence: 0.8 }],
      "text",
      "Secret therapy intake",
    );
    const dups = JSON.parse(processed.candidates[0]?.duplicateJson ?? "[]");
    expect(dups).toHaveLength(0);

    await expect(getCapture(db, sam.actor, "missing")).rejects.toThrow();
  });

  it("blocks cross-space reads", async () => {
    const { jordan, sam } = await twoPersonHousehold(db);
    const task = await createTask(db, jordan.actor, {
      spaceId: jordan.space.id,
      title: "Private note",
    });
    await expect(listTasks(db, sam.actor, { spaceId: jordan.space.id })).rejects.toBeInstanceOf(AuthzError);
    const listed = await listTasks(db, sam.actor);
    expect(listed.find((item) => item.id === task.id)).toBeUndefined();
  });
});

describe("collaboration", () => {
  it("lets one member add a pool item and the other claim it", async () => {
    const { jordan, sam, household } = await twoPersonHousehold(db);
    const task = await createTask(db, jordan.actor, {
      spaceId: household.id,
      title: "Take out recycling",
      collaborationState: "pool",
    });
    const claimed = await claimTask(db, sam.actor, task.id);
    expect(claimed.claimantId).toBe(sam.user.id);
    expect(claimed.collaborationState).toBe("claimed");
  });

  it("records a lightweight request", async () => {
    const { jordan, sam, household } = await twoPersonHousehold(db);
    const task = await requestTask(db, jordan.actor, {
      spaceId: household.id,
      title: "Grab Pepsi next store run",
      assigneeId: sam.user.id,
      context: "errand",
    });
    expect(task.collaborationState).toBe("requested");
    expect(task.assigneeId).toBe(sam.user.id);
  });
});

describe("projects", () => {
  it("derives progress from work", async () => {
    expect(
      projectProgress([
        { status: "completed", estimateMinutes: 60 },
        { status: "open", estimateMinutes: 60 },
      ]).percent,
    ).toBe(50);

    const { jordan, household } = await twoPersonHousehold(db);
    const project = await createProject(db, jordan.actor, {
      spaceId: household.id,
      name: "Finish Kitchen Remodel",
      outcome: "Usable kitchen",
    });
    await createTask(db, jordan.actor, {
      spaceId: household.id,
      projectId: project.id,
      title: "Paint",
      estimateMinutes: 60,
    });
    const loaded = await getProject(db, jordan.actor, project.id);
    expect(loaded.progress.open).toBe(1);
  });
});

describe("capture intelligence", () => {
  it("interprets dates and durations from planner text", () => {
    const drafts = interpretExtractedText(
      "Kitchen remodel:\nPaint trim 90m Friday\nCall dentist tomorrow 20m",
      new Date("2026-09-22T12:00:00"),
    );
    expect(drafts.some((item) => item.title.toLowerCase().includes("paint trim"))).toBe(true);
    expect(drafts.find((item) => item.title.toLowerCase().includes("paint"))?.estimateMinutes).toBe(90);
    expect(drafts.find((item) => item.projectHint?.toLowerCase().includes("kitchen"))).toBeTruthy();
  });

  it("proposes duplicates without merging them", () => {
    expect(similarity("Call dentist", "call the dentist")).toBeGreaterThan(0.7);
    const proposal = scoreDuplicate(
      { title: "Call dentist" },
      { id: "t1", title: "Call the dentist", status: "open" },
    );
    expect(proposal?.taskId).toBe("t1");
  });

  it("reconciles standalone, existing project, new project, and skip", async () => {
    const { jordan, household } = await twoPersonHousehold(db);
    const existing = await createProject(db, jordan.actor, {
      spaceId: household.id,
      name: "Finish Kitchen Remodel",
    });
    const capture = await createCaptureRecord(db, jordan.actor, {
      spaceId: household.id,
      sourceType: "text",
      textInput: "sample",
    });
    const processed = await attachCandidates(
      db,
      jordan.actor,
      capture.id,
      [
        { kind: "task", title: "Call dentist", confidence: 0.8 },
        { kind: "task", title: "Paint trim", confidence: 0.8, projectHint: "kitchen" },
        { kind: "task", title: "School garden night", confidence: 0.6, projectHint: "Garden club" },
        { kind: "task", title: "Skip me", confidence: 0.4 },
      ],
      "text",
      "sample",
    );

    const created = await reconcileCapture(
      db,
      jordan.actor,
      capture.id,
      processed.candidates.map((candidate) => {
        if (candidate.title === "Call dentist") {
          return { candidateId: candidate.id, action: "accept" as const, projectMode: "standalone" as const };
        }
        if (candidate.title === "Paint trim") {
          return {
            candidateId: candidate.id,
            action: "accept" as const,
            projectMode: "existing" as const,
            projectId: existing.id,
          };
        }
        if (candidate.title === "School garden night") {
          return {
            candidateId: candidate.id,
            action: "accept" as const,
            projectMode: "create" as const,
            newProjectName: "Garden club",
          };
        }
        return { candidateId: candidate.id, action: "skip" as const, projectMode: "standalone" as const };
      }),
    );

    expect(created).toHaveLength(3);
    const dentist = await db.task.findFirst({ where: { title: "Call dentist" } });
    expect(dentist?.projectId).toBeNull();
    const paint = await db.task.findFirst({ where: { title: "Paint trim" } });
    expect(paint?.projectId).toBe(existing.id);
    const garden = await db.project.findFirst({ where: { name: "Garden club" } });
    expect(garden).toBeTruthy();
    expect(await db.task.findFirst({ where: { title: "Skip me" } })).toBeNull();
  });
});

describe("planning and opportunity", () => {
  it("schedules a task as a time block, not an event", async () => {
    const { jordan, household } = await twoPersonHousehold(db);
    const task = await createTask(db, jordan.actor, {
      spaceId: household.id,
      title: "Install shelves",
      estimateMinutes: 90,
    });
    const start = new Date("2026-09-22T18:00:00");
    await scheduleTask(db, jordan.actor, {
      taskId: task.id,
      startAt: start,
      endAt: new Date(start.getTime() + 90 * 60000),
    });
    expect(await db.timeBlock.count()).toBe(1);
    expect(await db.calendarEvent.count()).toBe(0);
  });

  it("suggests work that fits a 45 minute window", async () => {
    const { jordan, household } = await twoPersonHousehold(db);
    await createTask(db, jordan.actor, {
      spaceId: household.id,
      title: "Unload dishwasher",
      estimateMinutes: 15,
    });
    await createTask(db, jordan.actor, {
      spaceId: household.id,
      title: "Rebuild deck",
      estimateMinutes: 240,
    });
    const suggestions = await suggestOpportunities(db, jordan.actor, { minutes: 45 });
    expect(suggestions[0]?.title).toBe("Unload dishwasher");
    expect(suggestions[0]?.reason).toContain("fits");
  });
});

describe("rituals", () => {
  it("marks a debrief complete", async () => {
    const { jordan, household } = await twoPersonHousehold(db);
    const ritual = await createRitual(db, jordan.actor, {
      spaceId: household.id,
      name: "Daily debrief",
      kind: "daily_debrief",
      cadence: "daily",
    });
    const due = await dueRituals(db, jordan.actor);
    expect(due.some((item) => item.id === ritual.id)).toBe(true);
    await completeRitual(db, jordan.actor, ritual.id, { "What landed?": "Painted cabinets" });
    const after = await dueRituals(db, jordan.actor);
    expect(after.some((item) => item.id === ritual.id)).toBe(false);
  });
});
