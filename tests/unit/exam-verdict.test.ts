import { describe, expect, it } from "vitest";
import {
  hashSource,
  signCodeVerdict,
  verifyCodeVerdict,
  VERDICT_TTL_SECONDS,
} from "@/lib/exam-verdict";

process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret-fuer-verdicts-0123456789";

describe("exam-verdict", () => {
  it("sign/verify Roundtrip", () => {
    const token = signCodeVerdict("q1", true, "int main(){}");
    const verdict = verifyCodeVerdict(token, "q1");
    expect(verdict).not.toBeNull();
    expect(verdict?.qid).toBe("q1");
    expect(verdict?.correct).toBe(true);
    expect(verdict?.sh).toBe(hashSource("int main(){}"));
  });

  it("falsches Ergebnis bleibt falsch", () => {
    const token = signCodeVerdict("q1", false, "x");
    expect(verifyCodeVerdict(token, "q1")?.correct).toBe(false);
  });

  it("manipulierte Payload wird abgelehnt", () => {
    const token = signCodeVerdict("q1", false, "x");
    const [v, body] = token.split(".");
    const tampered = JSON.parse(Buffer.from(body, "base64url").toString());
    tampered.correct = true; // Schummelversuch: false → true
    const newBody = Buffer.from(JSON.stringify(tampered)).toString("base64url");
    const forged = `${v}.${newBody}.${token.split(".")[2]}`;
    expect(verifyCodeVerdict(forged, "q1")).toBeNull();
  });

  it("Verdict für fremde questionId wird abgelehnt", () => {
    const token = signCodeVerdict("q1", true, "x");
    expect(verifyCodeVerdict(token, "q2")).toBeNull();
  });

  it("abgelaufenes Verdict wird abgelehnt", () => {
    const now = Math.floor(Date.now() / 1000);
    const token = signCodeVerdict("q1", true, "x", now - VERDICT_TTL_SECONDS - 10);
    expect(verifyCodeVerdict(token, "q1")).toBeNull();
  });

  it("frisch ausgestelltes Verdict ist innerhalb der TTL gültig", () => {
    const now = Math.floor(Date.now() / 1000);
    const token = signCodeVerdict("q1", true, "x", now);
    expect(verifyCodeVerdict(token, "q1", now + VERDICT_TTL_SECONDS - 60)).not.toBeNull();
  });

  it("Müll-Strings werden abgelehnt", () => {
    expect(verifyCodeVerdict("", "q1")).toBeNull();
    expect(verifyCodeVerdict("abc", "q1")).toBeNull();
    expect(verifyCodeVerdict("v1.xxx.yyy", "q1")).toBeNull();
    expect(verifyCodeVerdict("v2.xxx.yyy", "q1")).toBeNull();
  });
});
