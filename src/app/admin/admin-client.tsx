"use client";

import { useState } from "react";

export default function AdminClient() {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number; total: number } | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setJsonText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setError("JSON ist ungültig (Parse-Fehler).");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setResult({ created: data.created, updated: data.updated, total: data.total });
      return;
    }
    if (res.status === 401 || res.status === 403) {
      setError("Keine Admin-Berechtigung.");
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error ?? "Upload fehlgeschlagen.");
  }

  return (
    <div className="stack">
      {error && (
        <div className="badge" style={{ background: "rgba(174,46,36,0.1)", color: "#ae2e24" }}>
          {error}
        </div>
      )}
      {result && (
        <div className="badge badge--success">
          {result.created} neu · {result.updated} aktualisiert · {result.total} gesamt
        </div>
      )}
      <div className="field">
        <label htmlFor="file">JSON-Datei hochladen</label>
        <input id="file" type="file" accept="application/json,.json" onChange={onFile} />
      </div>
      <form onSubmit={upload} className="stack">
        <div className="field">
          <label htmlFor="json">Fragen als JSON</label>
          <textarea
            id="json"
            className="input"
            rows={16}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={
              '{\n' +
              '  "questions": [\n' +
              '    {\n' +
              '      "id": "beispiel-frage-1",\n' +
              '      "courseId": "mein-kurs",\n' +
              '      "chapter": 1,\n' +
              '      "chapterTitle": "Einführung",\n' +
              '      "question": "Beispielfrage mit Mehrfachauswahl?",\n' +
              '      "answer": "Die Musterantwort steht hier als Markdown.",\n' +
              '      "sourceRef": "skript.pdf S. 3",\n' +
              '      "confidence": "high",\n' +
              '      "mcqOptions": [\n' +
              '        { "id": "beispiel-frage-1-opt-1", "text": "Richtige Option", "correct": true },\n' +
              '        { "id": "beispiel-frage-1-opt-2", "text": "Falsche Option", "correct": false }\n' +
              '      ]\n' +
              '    },\n' +
              '    {\n' +
              '      "id": "beispiel-frage-2",\n' +
              '      "courseId": "mein-kurs",\n' +
              '      "chapter": 1,\n' +
              '      "chapterTitle": "Einführung",\n' +
              '      "question": "Beispielfrage für die freie Erinnerung?",\n' +
              '      "answer": "Kurze Musterantwort.",\n' +
              '      "sourceRef": "skript.pdf S. 5"\n' +
              '    }\n' +
              '  ]\n' +
              '}'
            }
            style={{ fontFamily: "monospace", fontSize: 13, resize: "vertical" }}
          />
        </div>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button type="submit" className="btn btn--primary btn--sm" disabled={loading || !jsonText.trim()}>
            {loading ? "Lädt …" : "Fragen hochladen"}
          </button>
        </div>
      </form>
    </div>
  );
}
