// Qualitäts-Hinweise für den Editor (Phase E5): analysiert die Fragen
// eines Kurses auf häufige Unvollständigkeiten (rein, ohne DB).

export type QualityQuestionInput = {
  id: string;
  taskType: string | null;
  payload: unknown;
  chapterId: string | null;
};

export type QualityWarning = {
  questionId: string;
  message: string;
};

export type CourseQuality = {
  total: number;
  byType: Record<string, number>;
  unassigned: number;
  warnings: QualityWarning[];
};

export function analyzeCourseQuality(questions: QualityQuestionInput[]): CourseQuality {
  const byType: Record<string, number> = {};
  const warnings: QualityWarning[] = [];
  let unassigned = 0;

  for (const q of questions) {
    const type = q.taskType ?? "recall";
    byType[type] = (byType[type] ?? 0) + 1;
    if (q.chapterId === null) unassigned++;

    if (type === "mcq") {
      const options = (q.payload as { options?: { text?: string; correct?: boolean }[] } | null)?.options ?? [];
      if (options.length < 2) {
        warnings.push({ questionId: q.id, message: "MCQ mit weniger als 2 Optionen" });
      }
      if (!options.some((o) => o.correct)) {
        warnings.push({ questionId: q.id, message: "MCQ ohne richtige Option" });
      }
      if (options.some((o) => !o.text?.trim())) {
        warnings.push({ questionId: q.id, message: "MCQ mit leerer Option" });
      }
    } else if (type === "dragdrop") {
      const p = q.payload as { zones?: unknown[]; items?: { id: string }[]; correct?: Record<string, string> } | null;
      const items = p?.items ?? [];
      const correct = p?.correct ?? {};
      const unassignedItems = items.filter((it) => !correct[it.id]);
      if (unassignedItems.length > 0) {
        warnings.push({
          questionId: q.id,
          message: `Zuordnen: ${unassignedItems.length} Element(e) ohne Zone`,
        });
      }
    } else if (type === "cloze") {
      const segments = (q.payload as { segments?: { kind: string }[] } | null)?.segments ?? [];
      if (!segments.some((s) => s.kind === "blank")) {
        warnings.push({ questionId: q.id, message: "Lückentext ohne Lücke" });
      }
    } else if (type === "order") {
      const items = (q.payload as { items?: unknown[] } | null)?.items ?? [];
      if (items.length < 2) {
        warnings.push({ questionId: q.id, message: "Sortieren mit weniger als 2 Elementen" });
      }
    } else if (type === "code") {
      const testCases = (q.payload as { testCases?: { hidden?: boolean }[] } | null)?.testCases ?? [];
      if (testCases.length === 0) {
        warnings.push({ questionId: q.id, message: "Code-Aufgabe ohne Testfall" });
      } else if (!testCases.some((t) => !t.hidden)) {
        warnings.push({ questionId: q.id, message: "Code-Aufgabe ohne öffentlichen Testfall" });
      }
    }
  }

  return { total: questions.length, byType, unassigned, warnings };
}
