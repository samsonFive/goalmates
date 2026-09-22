import type { DbClient } from "@/lib/db";
import { visibleSpaceIds } from "./authz";
import type { Actor } from "./types";

export type OpportunityPrefs = {
  minutes: number;
  energy?: "low" | "medium" | "high";
  mood?: string;
  context?: string;
};

export type Opportunity = {
  taskId: string;
  title: string;
  estimateMinutes: number | null;
  spaceName: string;
  projectName: string | null;
  reason: string;
  score: number;
};

export async function suggestOpportunities(
  db: DbClient,
  actor: Actor,
  prefs: OpportunityPrefs,
) {
  const spaceIds = await visibleSpaceIds(db, actor);
  const tasks = await db.task.findMany({
    where: {
      spaceId: { in: spaceIds },
      status: { in: ["open", "in_progress"] },
      OR: [
        { ownerId: actor.id },
        { claimantId: actor.id },
        { assigneeId: actor.id },
        { collaborationState: { in: ["pool", "collaborative"] } },
      ],
    },
    include: { space: true, project: true },
  });

  const now = Date.now();
  const scored: Opportunity[] = tasks
    .map((task) => {
      const estimate = task.estimateMinutes ?? 30;
      let score = 40;
      const reasons: string[] = [];

      if (estimate <= prefs.minutes) {
        score += 25;
        reasons.push(`fits ${prefs.minutes} minutes`);
      } else if (estimate <= prefs.minutes + 15) {
        score += 8;
        reasons.push("a little longer than the window");
      } else {
        score -= 20;
        reasons.push("longer than the window");
      }

      if (task.dueAt) {
        const hours = (task.dueAt.getTime() - now) / 36e5;
        if (hours <= 24) {
          score += 20;
          reasons.push("due soon");
        }
      }
      if (task.priority === "high") {
        score += 12;
        reasons.push("high priority");
      }
      if (prefs.energy === "low" && estimate <= 25) {
        score += 10;
        reasons.push("gentle on low energy");
      }
      if (prefs.energy === "high" && estimate >= 45) {
        score += 8;
        reasons.push("uses a high-energy window");
      }
      if (prefs.context && (task.context === prefs.context || task.tags.includes(prefs.context))) {
        score += 15;
        reasons.push(`matches ${prefs.context}`);
      }
      if (task.collaborationState === "requested" && task.assigneeId === actor.id) {
        score += 10;
        reasons.push("someone asked you");
      }
      if (task.project) {
        reasons.push(`moves ${task.project.name}`);
      }

      return {
        taskId: task.id,
        title: task.title,
        estimateMinutes: task.estimateMinutes,
        spaceName: task.space.name,
        projectName: task.project?.name ?? null,
        reason: reasons.join(" · "),
        score,
      };
    })
    .filter((item) => item.score >= 35)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return scored;
}
