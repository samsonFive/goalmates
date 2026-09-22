import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { createUserWithPersonalSpace } from "@/lib/domain/spaces";
import type { Actor } from "@/lib/domain/types";

export function actorFrom(user: { id: string; email: string; name: string; timezone: string }): Actor {
  return { id: user.id, email: user.email, name: user.name, timezone: user.timezone };
}

export async function resetDb(db: PrismaClient) {
  const tables = [
    "CaptureCandidate",
    "Capture",
    "FocusSession",
    "RitualOccurrence",
    "Ritual",
    "TimeBlock",
    "CalendarEvent",
    "WorkspaceBlock",
    "TaskParticipant",
    "Task",
    "ProjectParticipant",
    "Project",
    "Goal",
    "Activity",
    "Membership",
    "Space",
    "User",
  ];
  for (const table of tables) {
    await db.$executeRawUnsafe(`DELETE FROM "${table}";`);
  }
}

export async function twoPersonHousehold(db: PrismaClient) {
  const passwordHash = await hash("test-password", 4);
  const jordan = await createUserWithPersonalSpace(db, {
    email: "jordan@test.local",
    name: "Jordan",
    passwordHash,
  });
  const sam = await createUserWithPersonalSpace(db, {
    email: "sam@test.local",
    name: "Sam",
    passwordHash,
  });
  const household = await db.space.create({
    data: {
      type: "shared",
      name: "Test Household",
      ownerId: jordan.user.id,
      memberships: {
        create: [
          { userId: jordan.user.id, role: "owner" },
          { userId: sam.user.id, role: "member" },
        ],
      },
    },
  });
  return {
    jordan: { ...jordan, actor: actorFrom(jordan.user) },
    sam: { ...sam, actor: actorFrom(sam.user) },
    household,
  };
}
