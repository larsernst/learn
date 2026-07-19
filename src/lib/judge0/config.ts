// Judge0-Konfiguration – erzeugt (wenn aktiviert) einen Client aus den Env-
// Variablen. Server-only (env-Lesezugriff).

import { createJudge0Client, type Judge0Client } from "./client";

export function isJudge0Enabled(): boolean {
  return process.env.JUDGE0_ENABLED === "true";
}

export function getJudge0Client(): Judge0Client | null {
  if (!isJudge0Enabled()) return null;
  const baseUrl = process.env.JUDGE0_URL;
  const token = process.env.JUDGE0_TOKEN;
  if (!baseUrl || !token) return null;
  return createJudge0Client({ baseUrl, token });
}
