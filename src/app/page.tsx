import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const user = await getCurrentUser();
  const totalQuestions = await prisma.question.count();

  let dueCount = 0;
  if (user) {
    const now = new Date();
    dueCount = await prisma.review.count({
      where: { userId: user.sub, dueAt: { lte: now } },
    });
  }

  return (
    <div className="page" style={{ paddingTop: 96, paddingBottom: 96 }}>
      <p className="eyebrow">Fragenkatalog 2026 · Betriebssysteme Grundlagen</p>
      <h1>Betriebssysteme verstehen. Prüfungsfragen meistern.</h1>
      <p className="muted" style={{ maxWidth: 720, fontSize: 20 }}>
        Alle {totalQuestions} Prüfungsfragen aus der Vorlesung von Ing. Leonard Zeh –
        mit modellantworten aus den Vorlesungsfolien. Wiederhole mit Spaced Repetition
        (SM-2) und merke dir, was du noch nicht konntest.
      </p>

      <div className="row" style={{ marginTop: 32, flexWrap: "wrap" }}>
        {user ? (
          <>
            <Link href="/lernen" className="btn btn--primary">
              {dueCount > 0 ? `${dueCount} Fragen wiederholen` : "Jetzt lernen"}
            </Link>
            <Link href="/fortschritt" className="btn btn--secondary">
              Mein Fortschritt
            </Link>
          </>
        ) : (
          <>
            <Link href="/registrieren" className="btn btn--primary">
              Konto erstellen
            </Link>
            <Link href="/login" className="btn btn--secondary">
              Anmelden
            </Link>
          </>
        )}
      </div>

      <div className="grid grid--3" style={{ marginTop: 64 }}>
        <div className="card">
          <span className="badge">100 % Fragenkatalog</span>
          <h3>Alle Prüfungsfragen</h3>
          <p className="muted">
            Alle Fragen des offiziellen Katalogs mit Antworten aus den Vorlesungsfolien.
          </p>
        </div>
        <div className="card">
          <span className="badge">SM-2</span>
          <h3>Spaced Repetition</h3>
          <p className="muted">
            Wiederhole schwierige Fragen häufiger, leichte seltener – so bleiben sie im
            Langzeitgedächtnis.
          </p>
        </div>
        <div className="card">
          <span className="badge">Selbsteinschätzung</span>
          <h3>Freie Erinnerung</h3>
          <p className="muted">
            Du antwortest frei, deckst die Musterlösung auf und bewertest dich selbst
            („Again / Hard / Good / Easy").
          </p>
        </div>
      </div>
    </div>
  );
}