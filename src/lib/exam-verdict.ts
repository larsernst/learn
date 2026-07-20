// Code-Verdicts für den Prüfungsmodus.
//
// Problem: Code-Aufgaben können im Prüfungs-Batch nicht synchron bewertet
// werden (Judge0 läuft async pro Frage). Früher vertraute /api/exam/submit
// einem client-seitigen `correct`-Flag → Schummel-Lücke.
//
// Lösung: Die Bewertung passiert zum Zeitpunkt der Einreichung pro Frage
// über /api/exam/code-grade. Die Antwort enthält statt eines Wahrheits-
// flags ein server-signiertes Verdict (HMAC-SHA256 über qid + correct +
// sourceHash + Ablauf). /api/exam/submit prüft Signatur, Ablauf und
// questionId-Bezug – der Client kann das Ergebnis nicht fälschen.
//
// Format: v1.<base64url(json)>.<base64url(hmac)>
// Rein synchron (node:crypto), damit gradeExamAttempt sync bleibt.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Verdicts gelten 6 Stunden – länger als jede Prüfungssession.
export const VERDICT_TTL_SECONDS = 6 * 60 * 60;

export interface CodeVerdict {
  qid: string;
  correct: boolean;
  // sha256 des eingereichten Source-Codes (Nachvollziehbarkeit).
  sh: string;
  // Unix-Sekunden: Ablauf.
  exp: number;
}

function secret(): string {
  const s = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!s) {
    throw new Error("JWT_SECRET / NEXTAUTH_SECRET ist nicht gesetzt (.env?)");
  }
  return s;
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function hashSource(sourceCode: string): string {
  return createHash("sha256").update(sourceCode).digest("hex");
}

export function signCodeVerdict(
  questionId: string,
  correct: boolean,
  sourceCode: string,
  now: number = Math.floor(Date.now() / 1000)
): string {
  const payload: CodeVerdict = {
    qid: questionId,
    correct,
    sh: hashSource(sourceCode),
    exp: now + VERDICT_TTL_SECONDS,
  };
  const body = b64url(JSON.stringify(payload));
  return `v1.${body}.${sign(body)}`;
}

// Prüft Signatur, Ablauf und questionId-Bezug. Liefert das Verdict oder
// null (manipuliert/abgelaufen/fremde Frage ⇒ als falsch zu werten).
export function verifyCodeVerdict(
  token: string,
  questionId: string,
  now: number = Math.floor(Date.now() / 1000)
): CodeVerdict | null {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;
  const [, body, mac] = parts;

  const expected = sign(body);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: CodeVerdict;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString()) as CodeVerdict;
  } catch {
    return null;
  }
  if (typeof payload.qid !== "string" || typeof payload.correct !== "boolean") return null;
  if (typeof payload.exp !== "number" || payload.exp < now) return null;
  if (payload.qid !== questionId) return null;
  return payload;
}
