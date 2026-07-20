import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { getJudge0Client } from "@/lib/judge0/config";
import { gradeCodeWithJudge0 } from "@/lib/judge0/grade";
import { checkCodeQuestionAccess } from "@/lib/judge0/request-guard";
import { codeAttemptSchema } from "@/lib/tasks/code/attempt";

const codeRunSchema = codeAttemptSchema.extend({
  questionId: z.string().min(1),
});

// POST /api/review/code-run – Probelauf: führt den Code nur gegen die
// ÖFFENTLICHEN Testfälle aus. Kein SM-2-Update, kein ReviewEvent –
// Ausprobieren kostet keine Wertung. Ergebnis wie code-submit, nur ohne
// Bewertungsfelder.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  // Rate-Limit pro User: max 8 Probeläufe pro Minute (Judge0 ist teuer).
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`code-run:${user.sub}:${ip}`, 8, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Zu viele Probeläufe. Bitte in einer Minute erneut versuchen." },
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

  const parsed = codeRunSchema.safeParse(await request.json().catch(() => null));
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

  // Nur öffentliche Tests – versteckte bleiben der Einreichung vorbehalten.
  const publicPayload = {
    ...check.payload,
    testCases: check.payload.testCases.filter((t) => !t.hidden),
  };
  if (publicPayload.testCases.length === 0) {
    return NextResponse.json(
      { error: "Diese Aufgabe hat keine öffentlichen Testfälle." },
      { status: 400 }
    );
  }

  try {
    const result = await gradeCodeWithJudge0(
      publicPayload,
      { languageId, sourceCode },
      client
    );
    return NextResponse.json({
      ok: true,
      graded: "run" as const,
      allPassed: result.correct,
      detail: result.detail,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unbekannter Fehler.";
    return NextResponse.json(
      { error: `Probelauf fehlgeschlagen: ${msg}` },
      { status: 502 }
    );
  }
}
