import type { DbClient } from "@/lib/db";
import { visibleSpaceIds } from "./authz";
import type { Actor } from "./types";

export async function calibrationInsights(db: DbClient, actor: Actor) {
  const spaceIds = await visibleSpaceIds(db, actor);
  const completed = await db.task.findMany({
    where: {
      spaceId: { in: spaceIds },
      status: "completed",
      estimateMinutes: { not: null },
      actualMinutes: { not: null },
    },
    select: { estimateMinutes: true, actualMinutes: true, title: true, completedAt: true },
  });

  const plannedBlocks = await db.timeBlock.findMany({
    where: { spaceId: { in: spaceIds } },
    include: { task: true },
  });

  if (completed.length < 3) {
    return {
      sampleSize: completed.length,
      headline: "Not enough closed loops yet",
      detail:
        "After a few tasks with both an estimate and actual time, GoalMates can show planning calibration. No score is invented before then.",
      ratio: null,
      overplanning: null,
    };
  }

  const ratios = completed.map((task) => (task.actualMinutes ?? 0) / Math.max(task.estimateMinutes ?? 1, 1));
  const avg = ratios.reduce((sum, value) => sum + value, 0) / ratios.length;
  const plannedMinutes = plannedBlocks.reduce(
    (sum, block) => sum + (block.endAt.getTime() - block.startAt.getTime()) / 60000,
    0,
  );
  const completedFromPlan = plannedBlocks.filter((block) => block.task?.status === "completed").length;
  const plannedCount = plannedBlocks.length || 1;
  const completionRate = completedFromPlan / plannedCount;

  let headline = "Estimates are landing close";
  let detail = `Across ${completed.length} finished tasks, actual time is about ${Math.round(avg * 100)}% of the estimate.`;
  if (avg >= 1.25) {
    headline = "Work is taking longer than planned";
    detail = `Recent actuals run about ${Math.round((avg - 1) * 100)}% over the estimate. That is useful signal, not a verdict.`;
  } else if (avg <= 0.75) {
    headline = "Estimates are running high";
    detail = `Finished work is using about ${Math.round(avg * 100)}% of the time you set aside. You may be able to plan a little more tightly.`;
  }

  return {
    sampleSize: completed.length,
    headline,
    detail,
    ratio: Number(avg.toFixed(2)),
    overplanning:
      plannedBlocks.length >= 4
        ? {
            plannedCount: plannedBlocks.length,
            completedCount: completedFromPlan,
            completionRate: Number(completionRate.toFixed(2)),
            plannedMinutes: Math.round(plannedMinutes),
          }
        : null,
  };
}
