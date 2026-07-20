// Judge0 HTTP-Client – kapselt Submission + Polling gegen einen Judge0-Server.
// Rein (keine React-Abhängigkeit) und mit injizierbarem fetch für Unit-Tests.
//
// Auth: Judge0 CE erwartet das AUTHN_TOKEN als `X-Auth-Token`-Header
// (nicht Authorization: Bearer). Der Server erzwingt das Token nur, wenn
// AUTHN_TOKEN gesetzt ist – siehe docker-compose.yml (Profil `code`).
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
  command_line_arguments?: string;
}

// Judge0 1.13.1 nutzt für Limits cgroups v1 – auf modernen Hosts mit
// cgroups v2 schlägt isolate dann fehl (Internal Error „rb_sysopen /box/…").
// Sind BEIDE Flags true, verzichtet Judge0 auf cgroups und erzwingt Limits
// pro Prozess via rlimit (app/jobs/isolate_job.rb). Wir setzen sie daher
// immer – funktioniert auf cgroup-v1- und v2-Hosts gleichermaßen.
const CGROUP_V2_COMPAT = {
  enable_per_process_and_thread_time_limit: true,
  enable_per_process_and_thread_memory_limit: true,
} as const;

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
        "X-Auth-Token": opts.token,
      },
      body: JSON.stringify({ ...submission, ...CGROUP_V2_COMPAT }),
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
        { headers: { "X-Auth-Token": opts.token } }
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
