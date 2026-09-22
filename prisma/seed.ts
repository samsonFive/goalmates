import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { addDays, addHours, subDays } from "date-fns";
import { createUserWithPersonalSpace } from "../src/lib/domain/spaces";
import { ensureDefaultRituals } from "../src/lib/domain/rituals";

const db = new PrismaClient();

async function main() {
  const passwordHash = await hash("household-demo", 10);

  const jordan = await createUserWithPersonalSpace(db, {
    email: "jordan@goalmates.local",
    name: "Jordan Chen",
    passwordHash,
    isDemo: true,
  });
  const sam = await createUserWithPersonalSpace(db, {
    email: "sam@goalmates.local",
    name: "Sam Alvarez",
    passwordHash,
    isDemo: true,
  });

  const household = await db.space.create({
    data: {
      type: "shared",
      name: "The Household (demo)",
      ownerId: jordan.user.id,
      memberships: {
        create: [
          { userId: jordan.user.id, role: "owner" },
          { userId: sam.user.id, role: "member" },
        ],
      },
    },
  });
  await ensureDefaultRituals(db, household.id);

  const kitchen = await db.project.create({
    data: {
      spaceId: household.id,
      name: "Finish Kitchen Remodel",
      outcome: "Kitchen is painted, shelved, and usable for weeknight cooking.",
      reviewCadence: "weekly",
      participants: {
        create: [
          { userId: jordan.user.id, role: "owner" },
          { userId: sam.user.id, role: "member" },
        ],
      },
    },
  });

  await db.workspaceBlock.createMany({
    data: [
      {
        projectId: kitchen.id,
        type: "decision",
        title: "Paint color",
        content: "Agree on warm white for cabinets; keep the existing hardware.",
        sortOrder: 1,
      },
      {
        projectId: kitchen.id,
        type: "link",
        title: "Shelf spec",
        content: "https://example.com/kitchen-shelves",
        sortOrder: 2,
      },
      {
        projectId: kitchen.id,
        type: "research",
        title: "Trim notes",
        content: "Need 12ft of quarter-round. Measure again before Saturday.",
        sortOrder: 3,
      },
    ],
  });

  const now = new Date();
  await db.task.createMany({
    data: [
      {
        spaceId: household.id,
        projectId: kitchen.id,
        title: "Paint cabinet faces",
        estimateMinutes: 120,
        actualMinutes: 150,
        status: "completed",
        completedAt: subDays(now, 3),
        creatorId: jordan.user.id,
        ownerId: jordan.user.id,
        collaborationState: "claimed",
        claimantId: jordan.user.id,
      },
      {
        spaceId: household.id,
        projectId: kitchen.id,
        title: "Install pantry shelves",
        estimateMinutes: 90,
        status: "open",
        creatorId: jordan.user.id,
        collaborationState: "pool",
      },
      {
        spaceId: household.id,
        projectId: kitchen.id,
        title: "Cut and install trim",
        estimateMinutes: 75,
        status: "open",
        creatorId: sam.user.id,
        ownerId: sam.user.id,
        collaborationState: "claimed",
        claimantId: sam.user.id,
      },
    ],
  });

  await db.task.create({
    data: {
      spaceId: jordan.space.id,
      title: "Renew passport quietly",
      estimateMinutes: 15,
      dueAt: addDays(now, 1),
      creatorId: jordan.user.id,
      ownerId: jordan.user.id,
      collaborationState: "personal",
    },
  });

  await db.task.create({
    data: {
      spaceId: household.id,
      title: "Grab Pepsi next time you're at the store",
      context: "errand",
      tags: JSON.stringify(["errand"]),
      estimateMinutes: 10,
      collaborationState: "requested",
      creatorId: jordan.user.id,
      requesterId: jordan.user.id,
      assigneeId: sam.user.id,
    },
  });

  await db.task.create({
    data: {
      spaceId: household.id,
      title: "Take out recycling",
      estimateMinutes: 10,
      collaborationState: "pool",
      creatorId: sam.user.id,
    },
  });

  const privateTask = await db.task.findFirstOrThrow({
    where: { title: "Renew passport quietly", spaceId: jordan.space.id },
  });
  const shelves = await db.task.findFirstOrThrow({ where: { title: "Install pantry shelves" } });

  await db.timeBlock.create({
    data: {
      spaceId: household.id,
      taskId: shelves.id,
      title: shelves.title,
      startAt: addHours(now, 6),
      endAt: addHours(now, 7.5),
    },
  });

  await db.calendarEvent.create({
    data: {
      spaceId: household.id,
      title: "Hardware store run",
      startAt: addHours(now, 8),
      endAt: addHours(now, 9),
      source: "internal",
    },
  });

  await db.task.createMany({
    data: [
      {
        spaceId: household.id,
        title: "Unload dishwasher",
        estimateMinutes: 10,
        actualMinutes: 18,
        status: "completed",
        completedAt: subDays(now, 2),
        creatorId: sam.user.id,
        ownerId: sam.user.id,
        collaborationState: "claimed",
      },
      {
        spaceId: household.id,
        title: "School forms packet",
        estimateMinutes: 20,
        actualMinutes: 35,
        status: "completed",
        completedAt: subDays(now, 4),
        creatorId: jordan.user.id,
        ownerId: jordan.user.id,
        collaborationState: "claimed",
      },
      {
        spaceId: household.id,
        title: "Oil change appointment booking",
        estimateMinutes: 15,
        actualMinutes: 12,
        status: "completed",
        completedAt: subDays(now, 5),
        creatorId: jordan.user.id,
        ownerId: jordan.user.id,
        collaborationState: "claimed",
      },
    ],
  });

  await db.capture.create({
    data: {
      spaceId: household.id,
      userId: jordan.user.id,
      sourceType: "text",
      textInput: "Week of 9/22\nPaint trim 90m Friday\nCall dentist tomorrow\nGrocery run Saturday",
      status: "reconciled",
      provider: "text",
      rawExtraction: "Week of 9/22\nPaint trim 90m Friday\nCall dentist tomorrow\nGrocery run Saturday",
      reconciledAt: now,
    },
  });

  console.log("Seeded demo household. Jordan/Sam password: household-demo");
  console.log({ privateTask: privateTask.id });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
