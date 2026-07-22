import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { getJudge0Client } from "@/lib/judge0/config";
import { gradeCodeWithJudge0 } from "@/lib/judge0/grade";
import { checkCodeQuestionAccess } from "@/lib/judge0/request-guard";
import { signCodeVerdict } from "@/lib/exam-verdict";
import { codeAttemptSchema } from "@/lib/tasks/code/attempt";

const examCodeGradeSchema = codeAttemptSchema.extend({
  questionId: z.string().min(1),
});

// POST /api/exam/code-grade – bewertet eine Code-Aufgabe im Prüfungsmodus.
// Im Gegensatz zu /api/review/code-submit gibt es hier KEIN SM-2-Update;
// stattdessen wird ein signiertes Verdict ausgestellt, das der Client mit
// der Prüfungsabgabe zurückschickt (siehe src/lib/exam-verdict.ts).
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`exam-code-grade:${user.sub}:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Zu viele Code-Bewertungen. Bitte in einer Minute erneut versuchen." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const client = getJudge0Client();
  if (!client) {
    return NextResponse.json(
      { error: "Code-Aufgaben sind auf diesem Server nicht aktiviert (JUDGE0_ENABLED=false)." },
      { status: 503 }
    );
  }

  const parsed = examCodeGradeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Eingabe ungültig.", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { questionId, languageId, sourceCode } = parsed.data;

  const check = await checkCodeQuestionAccess(user, questionId, languageId);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    const result = await gradeCodeWithJudge0(
      check.payload,
      { languageId, sourceCode },
      client
    );
    return NextResponse.json({
      ok: true,
      correct: result.correct,
      detail: result.detail,
      verdict: signCodeVerdict(questionId, user.sub, result.correct, sourceCode),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unbekannter Fehler.";
    return NextResponse.json(
      { error: `Bewertung fehlgeschlagen: ${msg}` },
      { status: 502 }
    );
  }
}
