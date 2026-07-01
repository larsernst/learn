import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import StudyClient from "./study-client";
import { prisma } from "@/lib/prisma";

export default async function LernenPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const now = new Date();
  const dueToday = await prisma.review.count({
    where: { userId: user.sub, dueAt: { lte: now } },
  });

  return (
    <div className="page page--narrow" style={{ paddingTop: 64 }}>
      <p className="eyebrow">Lern-Sitzung</p>
      <h1>Heute wiederholen{dueToday > 0 ? `: ${dueToday} fällig` : ""}</h1>
      <p className="muted">
        Lies die Frage, antworte frei im Textfeld, decke die Musterantwort auf und bewerte
        dich selbst. Die nächste Wiederholung wird nach SM-2 geplant.
      </p>
      <StudyClient />
    </div>
  );
}