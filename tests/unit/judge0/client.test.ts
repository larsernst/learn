import { describe, expect, it, vi } from "vitest";
import { createJudge0Client, type Judge0Result } from "@/lib/judge0/client";

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");

const accepted: Judge0Result = {
  status: { id: 3, description: "Accepted" },
  stdout: b64("42\n"),
  token: "tok-1",
};

const queued: Judge0Result = {
  status: { id: 1, description: "In Queue" },
  token: "tok-1",
};

describe("createJudge0Client", () => {
  it("sendet X-Auth-Token-Header und Submission-Felder an Judge0", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(accepted));
    const client = createJudge0Client({
      baseUrl: "http://judge0:2358",
      token: "geheim",
      fetchImpl,
    });

    const result = await client.submit({
      language_id: 54,
      source_code: "int main(){}",
      stdin: "1\n",
      expected_output: "1\n",
      cpu_time_limit: 2,
      memory_limit: 262144,
    });

    expect(result.status.id).toBe(3);
    expect(result.stdout).toBe("42\n");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://judge0:2358/submissions?base64_encoded=true&wait=true");
    expect((init.headers as Record<string, string>)["X-Auth-Token"]).toBe("geheim");
    const body = JSON.parse(init.body as string);
    // Felder werden Base64-kodiert gesendet (Umlaute in Programmausgaben
    // sind im Plain-Modus von Judge0 1.13.1 nicht darstellbar).
    expect(body).toMatchObject({
      language_id: 54,
      source_code: b64("int main(){}"),
      stdin: b64("1\n"),
      expected_output: b64("1\n"),
    });
    // cgroup-v2-Kompatibilität: Limits pro Prozess statt cgroups.
    expect(body.enable_per_process_and_thread_time_limit).toBe(true);
    expect(body.enable_per_process_and_thread_memory_limit).toBe(true);
  });

  it("pollt bei nicht-terminalem Status mit Token nach", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(queued))
      .mockResolvedValueOnce(jsonResponse(accepted));
    const client = createJudge0Client({
      baseUrl: "http://judge0:2358",
      token: "geheim",
      fetchImpl,
      pollIntervalMs: 1,
      maxAttempts: 5,
    });

    const result = await client.submit({ language_id: 54, source_code: "x" });

    expect(result.status.id).toBe(3);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const [pollUrl, pollInit] = fetchImpl.mock.calls[1] as unknown as [string, RequestInit];
    expect(pollUrl).toBe("http://judge0:2358/submissions/tok-1?base64_encoded=true");
    expect((pollInit.headers as Record<string, string>)["X-Auth-Token"]).toBe("geheim");
  });

  it("bricht nach maxAttempts ab und liefert den letzten Stand", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(queued));
    const client = createJudge0Client({
      baseUrl: "http://judge0:2358",
      token: "t",
      fetchImpl,
      pollIntervalMs: 1,
      maxAttempts: 3,
    });

    const result = await client.submit({ language_id: 54, source_code: "x" });

    expect(result.status.id).toBe(1);
    // 1 POST + 3 GET-Polls.
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it("kodiert stdin/expected_output, aber nicht command_line_arguments", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(accepted));
    const client = createJudge0Client({
      baseUrl: "http://judge0:2358",
      token: "t",
      fetchImpl,
    });

    await client.submit({
      language_id: 54,
      source_code: "int main(){}",
      command_line_arguments: "eins zwei",
    });

    const body = JSON.parse(
      (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body as string
    );
    // Judge0 hat keinen Base64-Codec für command_line_arguments.
    expect(body.command_line_arguments).toBe("eins zwei");
    expect(body.source_code).toBe(b64("int main(){}"));
  });

  it("dekodiert Nicht-ASCII-Ausgaben (Umlaute) aus Base64", async () => {
    const umlaut: Judge0Result = {
      status: { id: 3, description: "Accepted" },
      stdout: b64("Zubehör\n"),
      stderr: b64("Größe\n"),
      token: "tok-9",
    };
    const fetchImpl = vi.fn(async () => jsonResponse(umlaut));
    const client = createJudge0Client({
      baseUrl: "http://judge0:2358",
      token: "t",
      fetchImpl,
    });

    const result = await client.submit({ language_id: 54, source_code: "x" });

    expect(result.stdout).toBe("Zubehör\n");
    expect(result.stderr).toBe("Größe\n");
  });

  it("wirft einen Fehler bei HTTP-Fehler des POST", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse("nope", { ok: false, status: 401 }));
    const client = createJudge0Client({
      baseUrl: "http://judge0:2358",
      token: "falsch",
      fetchImpl,
    });

    await expect(
      client.submit({ language_id: 54, source_code: "x" })
    ).rejects.toThrow("401");
  });
});
