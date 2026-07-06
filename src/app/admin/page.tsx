import AdminClient from "./admin-client";
import { requireAdminPage } from "@/lib/auth";

export default async function AdminPage() {
  await requireAdminPage();
  return (
    <div className="page page--narrow" style={{ paddingTop: 64 }}>
      <p className="eyebrow">Verwaltung</p>
      <h1>Admin</h1>
      <div className="row" style={{ gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <a className="navlink" href="/admin" style={{ fontWeight: 600 }}>Fragen</a>
        <a className="navlink" href="/admin/nutzer">Nutzer</a>
        <a className="navlink" href="/admin/einstellungen">Einstellungen</a>
      </div>
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
