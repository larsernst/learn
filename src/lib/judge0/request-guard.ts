// Gemeinsame Vorprüfung für /api/review/code-submit und /api/review/code-run:
// Frage existiert & sichtbar, ist Code-Aufgabe, Sprache erlaubt & angeboten.
// Server-only (DB-Zugriff).

import { prisma } from "@/lib/prisma";
import { canViewCourse } from "@/lib/course-access";
import { isAllowedLanguageId } from "./languages";
import { codePayloadSchema, type CodePayload } from "@/lib/tasks/code/payload";
import type { SessionPayload } from "@/lib/session";

export type CodeQuestionCheck =
  | { ok: true; payload: CodePayload }
  | { ok: false; status: number; error: string };

export async function checkCodeQuestionAccess(
  user: Pick<SessionPayload, "sub" | "roles">,
  questionId: string,
  languageId: number,
  opts: { requireSrs?: boolean } = {}
): Promise<CodeQuestionCheck> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { course: { select: { status: true, ownerId: true, srsEnabled: true } } },
  });
  if (!question) {
    return { ok: false, status: 404, error: "Frage nicht gefunden." };
  }
  // Draft-Kurse sind nur für Besitzer/Admins nutzbar (analog zur Kurs-
  // Sichtbarkeit; verwaiste Fragen ohne Kurs bleiben offen).
  if (question.course && !canViewCourse(user, question.course)) {
    return { ok: false, status: 404, error: "Frage nicht gefunden." };
  }
  // Review-Kontext (nicht Prüfung): Kurse mit deaktiviertem SR sperren.
  if (opts.requireSrs && question.course && !question.course.srsEnabled) {
    return {
      ok: false,
      status: 403,
      error: "Spaced Repetition ist für diesen Kurs deaktiviert.",
    };
  }
  if (question.taskType !== "code" || !question.payload) {
    return { ok: false, status: 400, error: "Frage ist keine Code-Aufgabe." };
  }

  const payloadParsed = codePayloadSchema.safeParse(question.payload);
  if (!payloadParsed.success) {
    return { ok: false, status: 500, error: "Code-Aufgabe ist fehlerhaft konfiguriert." };
  }
  const payload = payloadParsed.data;

  // Die Sprache muss (a) global freigeschaltet und (b) von der Aufgabe
  // angeboten werden – sonst liefe Code mit beliebiger Language-ID.
  if (!isAllowedLanguageId(languageId)) {
    return { ok: false, status: 400, error: "Programmiersprache ist nicht freigeschaltet." };
  }
  if (!payload.languages.some((l) => l.languageId === languageId)) {
    return { ok: false, status: 400, error: "Diese Sprache wird von der Aufgabe nicht angeboten." };
  }

  return { ok: true, payload };
}
