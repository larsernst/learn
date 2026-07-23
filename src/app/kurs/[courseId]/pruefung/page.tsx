import { getCurrentUserWithRoles } from "@/lib/auth";
import { redirect } from "next/navigation";
import PruefungClient from "./pruefung-client";
import { KursNav } from "../kurs-nav";
import { resolveCourse } from "../resolve-course";

export default async function PruefungPage({
  params,
}: {
  params: { courseId: string };
}) {
  const user = await getCurrentUserWithRoles();
  if (!user) redirect("/login");
  const course = await resolveCourse(params.courseId, { viewer: user });

  return (
    <div className="page page--narrow">
      <p className="eyebrow">{course.title} · Prüfungssimulation</p>
      <h1>Prüfung proben</h1>
      <KursNav courseId={course.id} srsEnabled={course.srsEnabled} />
      <p className="muted" style={{ marginTop: 16 }}>
        Wähle eine Anzahl Fragen. Du bekommst sie in zufälliger Reihenfolge –
        Freie-Erinnerungs-Fragen bewertest du selbst (richtig/falsch),
        Multiple-Choice wird automatisch ausgewertet. Am Ende siehst du deinen
        Punktestand. Optional kannst du das Ergebnis ins Spaced-Repetition-System
        übernehmen.
      </p>
      <PruefungClient courseId={course.id} />
    </div>
  );
}
