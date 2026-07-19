// Judge0 HTTP-Client – kapselt Submission + Polling gegen einen Judge0-Server.
// Rein (keine React-Abhängigkeit) und mit injizierbarem fetch für Unit-Tests.
//
// Status-Codes von Judge0 (v1.13): siehe
// https://github.com/judge0/judge0/blob/master/EXTRA_API.md#submissions
//   1=In Queue, 2=Processing, 3=Accepted, 4=Wrong Answer, 5=Time Limit Exceeded,
//   6=Compilation Error, 7-12=Runtime-Fehler, 13=Internal Error.

const TERMINAL_STATES = new Set([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);

export interface Judge0Submission {
  language_id: number;
  source_code: string;
  stdin?: string;
  expected_output?: string;
  cpu_time_limit?: number;
  memory_limit?: number;
}

export interface Judge0Result {
  status: {
    id: number;
    description: string;
  };
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  time?: string | null;
  memory?: number | null;
  token?: string;
}

export interface Judge0Client {
  submit(submission: Judge0Submission): Promise<Judge0Result>;
}

export interface Judge0ClientOptions {
  baseUrl: string;
  token: string;
  fetchImpl?: typeof fetch;
  maxAttempts?: number;
  pollIntervalMs?: number;
}

export function createJudge0Client(opts: Judge0ClientOptions): Judge0Client {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const maxAttempts = opts.maxAttempts ?? 30;
  const pollIntervalMs = opts.pollIntervalMs ?? 1000;

  async function submit(submission: Judge0Submission): Promise<Judge0Result> {
    const res = await fetchImpl(`${opts.baseUrl}/submissions?base64_encoded=false&wait=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opts.token}`,
      },
      body: JSON.stringify(submission),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Judge0 POST fehlgeschlagen (${res.status}): ${text}`);
    }
    const result = (await res.json()) as Judge0Result;
    return poll(result);
  }

  async function poll(result: Judge0Result): Promise<Judge0Result> {
    let attempts = 0;
    let current = result;
    while (!TERMINAL_STATES.has(current.status.id) && attempts < maxAttempts) {
      attempts++;
      await new Promise((r) => setTimeout(r, pollIntervalMs));
      if (!current.token) break;
      const res = await fetchImpl(
        `${opts.baseUrl}/submissions/${current.token}?base64_encoded=false`,
        { headers: { Authorization: `Bearer ${opts.token}` } }
      );
      if (!res.ok) break;
      current = (await res.json()) as Judge0Result;
    }
    return current;
  }

  return { submit };
}

// Status-IDs, die als "korrekt" gelten.
export const ACCEPTED_STATUS = 3;
// Status-IDs, die als "Compiler-/Laufzeitfehler" gelten (User-Fehler, kein
// System-Fehler). Für 13 (Internal Error) wirft der Grader stattdessen.
export const USER_ERROR_STATUSES = new Set([6, 7, 8, 9, 10, 11, 12]);
// Status-IDs, die als "falsche Antwort" gelten.
export const WRONG_ANSWER_STATUSES = new Set([4, 5]);

export function isAccepted(r: Judge0Result): boolean {
  return r.status.id === ACCEPTED_STATUS;
}

export function isSystemError(r: Judge0Result): boolean {
  return r.status.id === 13;
}
