import AdminSettingsClient from "./admin-settings-client";
import { requireAdminPage } from "@/lib/auth";
import { getMatureThresholdDays } from "@/lib/settings";

export default async function AdminEinstellungenPage() {
  await requireAdminPage();
  const matureThresholdDays = await getMatureThresholdDays();
  return (
    <div className="page page--narrow" style={{ paddingTop: 64 }}>
      <p className="eyebrow">Verwaltung</p>
      <h1>Einstellungen</h1>
      <div className="row" style={{ gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <a className="navlink" href="/admin">Fragen</a>
        <a className="navlink" href="/editor">Editor</a>
        <a className="navlink" href="/admin/nutzer">Nutzer</a>
        <a className="navlink" href="/admin/einstellungen" style={{ fontWeight: 600 }}>
          Einstellungen
        </a>
      </div>
      <div className="card">
        <AdminSettingsClient initialMatureThresholdDays={matureThresholdDays} />
      </div>
    </div>
  );
}
