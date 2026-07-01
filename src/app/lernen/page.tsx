import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import StudyClient from "./study-client";
import { prisma } from "@/lib/prisma";

export default async function LernenPage({
  searchParams,
}: {
  searchParams: { deck?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const now = new Date();
  const deck = searchParams.deck === "difficult" ? "difficult" : "all";
  const dueToday = await prisma.review.count({
    where: {
      userId: user.sub,
      dueAt: { lte: now },
      ...(deck === "difficult" ? { lapses: { gte: 1 } } : {}),
    },
  });
  const difficultDue = await prisma.review.count({
    where: { userId: user.sub, dueAt: { lte: now }, lapses: { gte: 1 } },
  });

  return (
    <div className="page page--narrow" style={{ paddingTop: 64 }}>
      <p className="eyebrow">Lern-Sitzung</p>
      <h1>
        {deck === "difficult" ? "Schwierige Karten" : "Heute wiederholen"}
        {dueToday > 0 ? `: ${dueToday} fällig` : ""}
      </h1>
      <div className="row" style={{ marginBottom: 16, flexWrap: "wrap" }}>
        <a
          className={`tab${deck === "all" ? " tab--active" : ""}`}
          href="/lernen"
        >
          Alle
        </a>
        <a
          className={`tab${deck === "difficult" ? " tab--active" : ""}`}
          href="/lernen?deck=difficult"
        >
          Schwierig{difficultDue > 0 ? ` (${difficultDue})` : ""}
        </a>
      </div>
      <StudyClient deck={deck} />
      <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>
        Tastatur: <strong>Leertaste/Enter</strong> = Aufdecken/Bestätigen ·{" "}
        <strong>1–4</strong> = Again/Hard/Good/Easy (Freie Erinnerung) ·{" "}
        <strong>1–n</strong> = Option togglen (MCQ)
      </p>
    </div>
  );
}