import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import PruefungClient from "./pruefung-client";

export default async function PruefungPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div className="page page--narrow" style={{ paddingTop: 64 }}>
      <p className="eyebrow">Prüfungssimulation</p>
      <h1>Prüfung proben</h1>
      <p className="muted">
        Wähle eine Anzahl Fragen. Du bekommst sie in zufälliger Reihenfolge –
        Freie-Erinnerungs-Fragen bewertest du selbst (richtig/falsch),
        Multiple-Choice wird automatisch ausgewertet. Am Ende siehst du deinen
        Punktestand. Optional kannst du das Ergebnis ins Spaced-Repetition-System
        übernehmen.
      </p>
      <PruefungClient />
    </div>
  );
}