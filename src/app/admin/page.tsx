import AdminClient from "./admin-client";

export default function AdminPage() {
  return (
    <div className="page page--narrow" style={{ paddingTop: 64 }}>
      <p className="eyebrow">Verwaltung</p>
      <h1>Admin</h1>
      <div className="card">
        <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
          Fragen als JSON hochladen. Das Format entspricht dem Fragenkatalog.
          Beispiel:
        </p>
        <pre
          className="muted"
          style={{
            fontSize: 12,
            background: "var(--ds-background-canvas)",
            padding: 12,
            borderRadius: 8,
            overflow: "auto",
            marginBottom: 16,
          }}
        >{`{
  "questions": [
    {
      "id": "1-aufgaben-bs",
      "chapter": 1,
      "chapterTitle": "Einführung",
      "question": "Welche Aufgaben hat ein Betriebssystem?",
      "answer": "…",
      "sourceRef": "quelle.md",
      "mcqOptions": [
        { "id": "opt-1", "text": "Antwort A", "correct": true },
        { "id": "opt-2", "text": "Antwort B", "correct": false }
      ]
    }
  ]
}`}</pre>
        <AdminClient />
      </div>
    </div>
  );
}
