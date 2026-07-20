import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEditorApi } from "@/lib/auth";
import { canEditCourse } from "@/lib/course-access";
import { rateLimit } from "@/lib/rate-limit";
import { getJudge0Client } from "@/lib/judge0/config";
import { gradeCodeWithJudge0 } from "@/lib/judge0/grade";
import { codePayloadSchema } from "@/lib/tasks/code/payload";

const codeCheckSchema = z.object({
  payload: z.unknown(),
});

// POST /api/courses/[id]/questions/code-check – Autoren-Werkzeug: führt die
// Musterlösung (referenceSolution) eines Code-Payloads gegen ALLE Testfälle
// aus (public + hidden). So validieren Autoren Aufgabe + Tests, bevor sie
// veröffentlicht werden. Kein SM-2, keine ReviewEvents.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireEditorApi();
  if (!guard.ok) return guard.response;

  const rl = rateLimit(`code-check:${guard.user.sub}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Zu viele Prüfläufe. Bitte in einer Minute erneut versuchen." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    select: { id: true, ownerId: true },
  });
  if (!course) {
    return NextResponse.json({ error: "Kurs nicht gefunden." }, { status: 404 });
  }
  if (!canEditCourse(guard.user, course)) {
    return NextResponse.json({ error: "Keine Berechtigung für diesen Kurs." }, { status: 403 });
  }

  const client = getJudge0Client();
  if (!client) {
    return NextResponse.json(
      { error: "Code-Prüfung nicht möglich: Judge0 ist deaktiviert (JUDGE0_ENABLED=false)." },
      { status: 503 }
    );
  }

  const parsed = codeCheckSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Eingabe ungültig.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const payloadParsed = codePayloadSchema.safeParse(parsed.data.payload);
  if (!payloadParsed.success) {
    return NextResponse.json(
      { error: "Payload verletzt das code-Schema.", issues: payloadParsed.error.issues },
      { status: 400 }
    );
  }
  const payload = payloadParsed.data;

  if (!payload.referenceSolution?.trim()) {
    return NextResponse.json(
      { error: "Keine Musterlösung hinterlegt (referenceSolution leer)." },
      { status: 400 }
    );
  }

  const language = payload.languages[0];
  try {
    const result = await gradeCodeWithJudge0(
      payload,
      { languageId: language.languageId, sourceCode: payload.referenceSolution },
      client
    );
    return NextResponse.json({
      ok: true,
      correct: result.correct,
      detail: result.detail,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unbekannter Fehler.";
    return NextResponse.json(
      { error: `Prüflauf fehlgeschlagen: ${msg}` },
      { status: 502 }
    );
  }
}
