import type { DuplicateCandidate } from "./types";

const STOP = new Set(["the", "a", "an", "to", "for", "and", "of", "on", "in", "at"]);

export function normalizeTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token && !STOP.has(token))
    .join(" ")
    .trim();
}

export function tokenSet(title: string) {
  return new Set(normalizeTitle(title).split(" ").filter(Boolean));
}

export function jaccard(a: string, b: string) {
  const left = tokenSet(a);
  const right = tokenSet(b);
  if (left.size === 0 || right.size === 0) return 0;
  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) overlap += 1;
  }
  return overlap / new Set([...left, ...right]).size;
}

export function levenshteinRatio(a: string, b: string) {
  const left = normalizeTitle(a);
  const right = normalizeTitle(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  const matrix: number[][] = [];
  for (let i = 0; i <= left.length; i += 1) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= right.length; j += 1) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  const distance = matrix[left.length][right.length];
  return 1 - distance / Math.max(left.length, right.length);
}

export function similarity(a: string, b: string) {
  return Math.max(jaccard(a, b), levenshteinRatio(a, b));
}

export function scoreDuplicate(
  incoming: { title: string; dueAt?: Date | null; projectId?: string | null },
  existing: {
    id: string;
    title: string;
    status: string;
    dueAt?: Date | null;
    projectId?: string | null;
    projectName?: string | null;
  },
): DuplicateCandidate | null {
  const score = similarity(incoming.title, existing.title);
  if (score < 0.62) return null;

  const reasons: string[] = [];
  if (normalizeTitle(incoming.title) === normalizeTitle(existing.title)) {
    reasons.push("same wording");
  } else {
    reasons.push("similar wording");
  }
  if (incoming.projectId && incoming.projectId === existing.projectId) {
    reasons.push("same project");
  }
  if (incoming.dueAt && existing.dueAt) {
    const delta = Math.abs(incoming.dueAt.getTime() - existing.dueAt.getTime());
    if (delta <= 1000 * 60 * 60 * 48) reasons.push("nearby date");
  }
  if (existing.status === "completed") reasons.push("already completed");

  return {
    taskId: existing.id,
    title: existing.title,
    status: existing.status,
    projectName: existing.projectName ?? null,
    score: Number(score.toFixed(2)),
    reason: reasons.join(" · "),
  };
}
