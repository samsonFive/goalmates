import { addDays, nextDay, setHours, setMinutes, type Day } from "date-fns";
import type { CaptureCandidateDraft } from "@/lib/domain/types";

const WEEKDAYS: Record<string, Day> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const DURATION = /(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)\b/i;

function parseDuration(line: string): number | null {
  const match = line.match(DURATION);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (["h", "hr", "hrs", "hour", "hours"].includes(unit)) {
    return Math.round(amount * 60);
  }
  return Math.round(amount);
}

function parseWhen(line: string, now = new Date()): Date | null {
  const lower = line.toLowerCase();
  if (/\btoday\b/.test(lower)) return now;
  if (/\btomorrow\b/.test(lower)) return addDays(now, 1);
  for (const [name, day] of Object.entries(WEEKDAYS)) {
    if (new RegExp(`\\b${name}\\b`).test(lower)) {
      return nextDay(now, day);
    }
  }
  const iso = line.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) return new Date(`${iso[1]}T12:00:00`);
  const us = line.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (us) {
    const year = us[3] ? Number(us[3].length === 2 ? `20${us[3]}` : us[3]) : now.getFullYear();
    return new Date(year, Number(us[1]) - 1, Number(us[2]), 12);
  }
  return null;
}

function parseTime(line: string, base: Date): Date | null {
  const match = line.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  const meridian = match[3].toLowerCase();
  if (meridian === "pm" && hours < 12) hours += 12;
  if (meridian === "am" && hours === 12) hours = 0;
  return setMinutes(setHours(base, hours), minutes);
}

function cleanTitle(line: string) {
  return line
    .replace(/^[-*•\d.)\s]+/, "")
    .replace(DURATION, "")
    .replace(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, "")
    .replace(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/, "")
    .replace(/\b20\d{2}-\d{2}-\d{2}\b/, "")
    .replace(/\b\d{1,2}(?::\d{2})?\s*(am|pm)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function interpretExtractedText(text: string, now = new Date()): CaptureCandidateDraft[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 1 && !/^week of\b/i.test(line));

  const drafts: CaptureCandidateDraft[] = [];
  let currentProjectHint: string | null = null;

  for (const line of lines) {
    const heading = line.match(/^(project|for)\s*[:|-]\s*(.+)$/i);
    if (heading) {
      currentProjectHint = heading[2].trim();
      continue;
    }
    if (/:$/.test(line) && line.length < 48 && !DURATION.test(line)) {
      currentProjectHint = line.replace(/:$/, "").trim();
      continue;
    }

    const title = cleanTitle(line);
    if (title.length < 2) continue;

    const dueAt = parseWhen(line, now);
    const scheduledStart = dueAt ? parseTime(line, dueAt) : parseTime(line, now);
    const estimateMinutes = parseDuration(line);
    const looksLikeEvent = /\b(appointment|meet|meeting|dinner|birthday|flight)\b/i.test(line);

    drafts.push({
      kind: looksLikeEvent ? "event" : "task",
      title,
      dueAt,
      scheduledStart,
      estimateMinutes,
      confidence: estimateMinutes || dueAt ? 0.72 : 0.58,
      projectHint: currentProjectHint,
      evidence: line,
    });
  }

  return drafts.slice(0, 40);
}
