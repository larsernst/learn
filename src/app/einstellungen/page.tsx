import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SettingsClient from "./settings-client";
import PasswordForm from "./password-form";

export default async function EinstellungenPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { name: true, email: true, mcqEnabled: true, simpleGrading: true, newQuestionsFirst: true, createdAt: true },
  });
  if (!me) redirect("/login");

  return (
    <div className="page page--narrow">
      <p className="eyebrow">Einstellungen</p>
      <h1>Mein Konto</h1>
      <div className="card">
        <div className="field">
          <label>Name</label>
          <input className="input" value={me.name} readOnly />
        </div>
        <div className="field">
          <label>E-Mail</label>
          <input className="input" value={me.email} readOnly />
        </div>
        <p className="muted text-sm">
          Mitglied seit {me.createdAt.toLocaleDateString("de-DE")}.
        </p>
        <hr className="divider" />
        <SettingsClient
          initialMcqEnabled={me.mcqEnabled}
          initialSimpleGrading={me.simpleGrading}
          initialNewQuestionsFirst={me.newQuestionsFirst}
        />
        <hr className="divider" />
        <div>
          <strong>Passwort ändern</strong>
          <p className="muted text-sm" style={{ marginTop: 4, marginBottom: 16 }}>
            Wähle ein starkes Passwort, das du nirgendwo anders verwendest.
          </p>
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}