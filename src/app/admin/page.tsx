import { requireAdminPage } from "@/lib/auth";

// Admin-Übersicht (früher: JSON-Fragen-Upload). Der Fragen-Import liegt
// nun im Editor (Kurs-Einstellungen); hier landen Admins auf ihrer
// Verwaltungsübersicht mit den admin-only Bereichen.
export default async function AdminIndexPage() {
  await requireAdminPage();
  return (
    <div className="page page--narrow">
      <p className="eyebrow">Verwaltung</p>
      <h1>Admin</h1>
      <div className="row" style={{ gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <a className="navlink navlink--active" href="/admin">
          Admin
        </a>
        <a className="navlink" href="/editor">Editor</a>
        <a className="navlink" href="/admin/nutzer">Nutzer</a>
        <a className="navlink" href="/admin/einstellungen">Einstellungen</a>
      </div>
      <div className="stack">
        <a className="card" href="/admin/nutzer" style={{ textDecoration: "none", display: "block" }}>
          <h2 style={{ margin: "0 0 4px" }}>Nutzer</h2>
          <p className="muted text-sm" style={{ margin: 0 }}>
            Konten verwalten und Rollen (Admin/Editor) vergeben.
          </p>
        </a>
        <a className="card" href="/admin/einstellungen" style={{ textDecoration: "none", display: "block" }}>
          <h2 style={{ margin: "0 0 4px" }}>Einstellungen</h2>
          <p className="muted text-sm" style={{ margin: 0 }}>
            App-weite Einstellungen verwalten.
          </p>
        </a>
      </div>
    </div>
  );
}
