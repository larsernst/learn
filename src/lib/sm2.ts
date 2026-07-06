export type ReviewGrade = "again" | "hard" | "good" | "easy";

export interface Sm2State {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  dueAt: Date;
  lastReviewedAt: Date | null;
}

export interface Sm2UpdateInput {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  dueAt: Date;
  lastReviewedAt: Date | null;
}

export const SM2_DEFAULTS = {
  easeFactor: 2.5,
  intervalDays: 0,
  repetitions: 0,
  lapses: 0,
  easeFloor: 1.3,
};

export const MAX_INTERVAL_DAYS = 2;

export function clampEase(ef: number): number {
  return Math.max(SM2_DEFAULTS.easeFloor, ef);
}

export function gradeToQuality(grade: ReviewGrade): number {
  switch (grade) {
    case "again":
      return 1;
    case "hard":
      return 3;
    case "good":
      return 4;
    case "easy":
      return 5;
  }
}

export function nextIntervalDays(repetitions: number, prevInterval: number, ef: number): number {
  if (repetitions <= 0) return 0;
  if (repetitions === 1) return 1;
  if (repetitions === 2) return Math.min(6, MAX_INTERVAL_DAYS);
  return Math.min(Math.round(prevInterval * ef), MAX_INTERVAL_DAYS);
}

export function applySm2(prev: Sm2UpdateInput, grade: ReviewGrade, now: Date = new Date()): Sm2UpdateInput {
  const q = gradeToQuality(grade);
  let { easeFactor: ef, intervalDays: interval, repetitions: reps, lapses } = prev;

  if (grade === "again") {
    reps = 0;
    interval = 0;
    lapses = lapses + 1;
  } else {
    reps = reps + 1;
    interval = nextIntervalDays(reps, interval, ef);
  }

  const deltaEf = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  ef = clampEase(ef + deltaEf);

  const due = new Date(now.getTime());
  due.setDate(due.getDate() + interval);

  return {
    easeFactor: ef,
    intervalDays: interval,
    repetitions: reps,
    lapses,
    dueAt: due,
    lastReviewedAt: now,
  };
}

export function isDue(state: { dueAt: Date }, now: Date = new Date()): boolean {
  return state.dueAt.getTime() <= now.getTime();
}

export function isMcqCorrect(selected: string[], correctOptionIds: string[]): boolean {
  const sel = new Set(selected);
  const corr = new Set(correctOptionIds);
  if (sel.size !== corr.size) return false;
  for (const id of sel) {
    if (!corr.has(id)) return false;
  }
  return true;
}

export function mcqGrade(correct: boolean): ReviewGrade {
  return correct ? "good" : "again";
}

export function intervalLabel(intervalDays: number): string {
  if (intervalDays <= 0) return "heute";
  if (intervalDays === 1) return "morgen";
  if (intervalDays < 7) return `in ${intervalDays} Tagen`;
  if (intervalDays < 30) return `in ${Math.round(intervalDays / 7)} Wochen`;
  if (intervalDays < 365) return `in ${Math.round(intervalDays / 30)} Monaten`;
  return `in ${Math.round(intervalDays / 365)} Jahren`;
}