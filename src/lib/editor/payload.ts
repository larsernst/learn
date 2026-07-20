// Payload-Bau für die geführten Fragen-Editoren: Form-State <-> Payload.
// Reine Funktionen – die React-Editoren halten nur Form-State, der
// Server bekommt ein valides Bundle-Payload (Zod prüft serverseitig nach).

import type { McqPayload } from "@/lib/tasks/mcq/payload";
import type { DragDropPayload } from "@/lib/tasks/dragdrop/payload";
import type { OrderPayload } from "@/lib/tasks/order/payload";
import type { CodePayload } from "@/lib/tasks/code/payload";
import {
  CODE_IO_MAX,
  CODE_SOURCE_MAX,
  CODE_TESTCASES_MAX,
} from "@/lib/tasks/code/payload";
import { JUDGE0_LANGUAGES } from "@/lib/judge0/languages";

export type McqFormState = {
  options: { text: string; correct: boolean }[];
};

export type DragDropFormState = {
  zones: { label: string }[];
  items: { text: string; zoneIndex: number | null }[];
};

export type OrderFormState = {
  items: string[];
};

export type CodeTestCaseForm = {
  input: string;
  args: string;
  expectedOutput: string;
  hidden: boolean;
};

export type CodeFormState = {
  languageId: number;
  starterCode: string;
  referenceSolution: string;
  testCases: CodeTestCaseForm[];
  comparisonMode: "exact" | "trim" | "float";
  // Formular-Repräsentation (Textfeld); wird beim Bauen geparst.
  floatTolerance: string;
  timeLimitMs: number;
  memoryLimitKb: number;
};

// ── MCQ ───────────────────────────────────────────────────────────────
export function buildMcqPayload(form: McqFormState): McqPayload {
  return {
    options: form.options.map((o, i) => ({
      id: `opt-${i + 1}`,
      text: o.text,
      correct: o.correct,
    })),
  };
}

export function mcqToForm(payload: unknown): McqFormState {
  const p = payload as McqPayload | null;
  return {
    options: (p?.options ?? []).map((o) => ({ text: o.text, correct: o.correct })),
  };
}

export function mcqFormError(form: McqFormState): string | null {
  const filled = form.options.filter((o) => o.text.trim());
  if (filled.length < 2) return "Mindestens zwei Optionen mit Text.";
  if (!form.options.some((o) => o.correct && o.text.trim())) {
    return "Mindestens eine Option muss als richtig markiert sein.";
  }
  if (form.options.some((o) => o.correct && !o.text.trim())) {
    return "Eine als richtig markierte Option hat keinen Text.";
  }
  return null;
}

export function mcqSelectionMode(form: McqFormState): "single" | "multi" {
  return form.options.filter((o) => o.correct).length === 1 ? "single" : "multi";
}

// ── Drag & Drop ───────────────────────────────────────────────────────
export function buildDragDropPayload(form: DragDropFormState): DragDropPayload {
  const zones = form.zones.map((z, i) => ({ id: `zone-${i + 1}`, label: z.label }));
  const items = form.items.map((it, i) => ({ id: `item-${i + 1}`, text: it.text }));
  const correct: Record<string, string> = {};
  form.items.forEach((it, i) => {
    if (it.zoneIndex !== null && zones[it.zoneIndex]) {
      correct[`item-${i + 1}`] = zones[it.zoneIndex].id;
    }
  });
  return { zones, items, correct };
}

export function dragdropToForm(payload: unknown): DragDropFormState {
  const p = payload as DragDropPayload | null;
  const zones = (p?.zones ?? []).map((z) => ({ label: z.label }));
  const zoneIdxById = new Map((p?.zones ?? []).map((z, i) => [z.id, i]));
  const items = (p?.items ?? []).map((it) => ({
    text: it.text,
    zoneIndex: p?.correct?.[it.id] !== undefined ? (zoneIdxById.get(p.correct[it.id]) ?? null) : null,
  }));
  return { zones, items };
}

export function dragdropFormError(form: DragDropFormState): string | null {
  if (form.zones.filter((z) => z.label.trim()).length < 1) {
    return "Mindestens eine Zone mit Bezeichnung.";
  }
  if (form.items.filter((i) => i.text.trim()).length < 1) {
    return "Mindestens ein Element mit Text.";
  }
  if (form.zones.some((z) => !z.label.trim())) return "Eine Zone hat keine Bezeichnung.";
  if (form.items.some((i) => !i.text.trim())) return "Ein Element hat keinen Text.";
  if (form.items.some((i) => i.zoneIndex === null)) {
    return "Jedes Element muss einer Zone zugeordnet sein.";
  }
  return null;
}

// ── Order ─────────────────────────────────────────────────────────────
export function buildOrderPayload(form: OrderFormState): OrderPayload {
  const items = form.items.map((text, i) => ({ id: `step-${i + 1}`, text }));
  return { items, correctOrder: items.map((i) => i.id) };
}

export function orderToForm(payload: unknown): OrderFormState {
  const p = payload as OrderPayload | null;
  const textById = new Map((p?.items ?? []).map((i) => [i.id, i.text]));
  const items = (p?.correctOrder ?? [])
    .map((id) => textById.get(id))
    .filter((t): t is string => typeof t === "string");
  return { items: items.length > 0 ? items : (p?.items ?? []).map((i) => i.text) };
}

export function orderFormError(form: OrderFormState): string | null {
  if (form.items.length < 2) return "Mindestens zwei Elemente.";
  if (form.items.some((i) => !i.trim())) return "Ein Element hat keinen Text.";
  return null;
}

// ── Code ──────────────────────────────────────────────────────────────
// Kanonische Sprachliste: src/lib/judge0/languages.ts (Single Source).
export const CODE_LANGUAGES: { languageId: number; label: string }[] =
  JUDGE0_LANGUAGES.map((l) => ({ languageId: l.languageId, label: l.label }));

export const CODE_LIMIT_PRESETS: { label: string; timeLimitMs: number; memoryLimitKb: number }[] = [
  { label: "Standard (2 s · 256 MB)", timeLimitMs: 2000, memoryLimitKb: 262144 },
  { label: "Streng (1 s · 128 MB)", timeLimitMs: 1000, memoryLimitKb: 131072 },
  { label: "Locker (5 s · 512 MB)", timeLimitMs: 5000, memoryLimitKb: 524288 },
];

export function buildCodePayload(form: CodeFormState): CodePayload {
  const lang = CODE_LANGUAGES.find((l) => l.languageId === form.languageId);
  const tolerance = Number(form.floatTolerance);
  return {
    languages: [
      {
        languageId: form.languageId,
        label: lang?.label ?? `Language ${form.languageId}`,
        starterCode: form.starterCode,
      },
    ],
    testCases: form.testCases.map((t, i) => ({
      id: `test-${i + 1}`,
      input: t.input,
      ...(t.args.trim() ? { args: t.args.trim() } : {}),
      expectedOutput: t.expectedOutput,
      hidden: t.hidden,
    })),
    comparison: {
      mode: form.comparisonMode,
      ...(form.comparisonMode === "float" && Number.isFinite(tolerance) && tolerance > 0
        ? { floatTolerance: tolerance }
        : {}),
    },
    ...(form.referenceSolution.trim()
      ? { referenceSolution: form.referenceSolution }
      : {}),
    timeLimitMs: form.timeLimitMs,
    memoryLimitKb: form.memoryLimitKb,
  };
}

export function codeToForm(payload: unknown): CodeFormState {
  const p = payload as CodePayload | null;
  const lang = p?.languages?.[0];
  return {
    languageId: lang?.languageId ?? 71,
    starterCode: lang?.starterCode ?? "",
    referenceSolution: p?.referenceSolution ?? "",
    testCases: (p?.testCases ?? []).map((t) => ({
      input: t.input,
      args: t.args ?? "",
      expectedOutput: t.expectedOutput,
      hidden: t.hidden,
    })),
    comparisonMode: p?.comparison?.mode ?? "exact",
    floatTolerance: p?.comparison?.floatTolerance?.toString() ?? "0.0001",
    timeLimitMs: p?.timeLimitMs ?? 2000,
    memoryLimitKb: p?.memoryLimitKb ?? 262144,
  };
}

export function codeFormError(form: CodeFormState): string | null {
  if (form.testCases.length < 1) return "Mindestens ein Testfall.";
  if (form.testCases.length > CODE_TESTCASES_MAX) {
    return `Höchstens ${CODE_TESTCASES_MAX} Testfälle.`;
  }
  if (form.starterCode.length > CODE_SOURCE_MAX) {
    return `Starter-Code ist zu lang (max. ${CODE_SOURCE_MAX} Zeichen).`;
  }
  if (form.testCases.some((t) => !t.expectedOutput.trim())) {
    return "Jeder Testfall braucht eine erwartete Ausgabe.";
  }
  if (
    form.testCases.some(
      (t) => t.input.length > CODE_IO_MAX || t.expectedOutput.length > CODE_IO_MAX
    )
  ) {
    return `Testfall-Ein-/Ausgaben sind zu lang (max. ${CODE_IO_MAX} Zeichen).`;
  }
  if (!form.testCases.some((t) => !t.hidden)) {
    return "Mindestens ein Testfall sollte öffentlich sein (Lernende sehen ihn).";
  }
  if (form.comparisonMode === "float") {
    const t = Number(form.floatTolerance);
    if (!Number.isFinite(t) || t <= 0 || t > 1) {
      return "Float-Modus: Toleranz muss eine Zahl in (0, 1] sein.";
    }
  }
  return null;
}
