import type { Metadata } from "next";
import "./globals.css";
import { getCurrentUser } from "@/lib/session";
import Link from "next/link";

export const metadata: Metadata = {
  title: "BS Lern-App – Betriebssysteme Grundlagen",
  description:
    "Lern-App für den Fragenkatalog Betriebssysteme Grundlagen (Dozent L. Zeh) mit Lückentext-Wiederholung und Spaced Repetition.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="de">
      <body>
        <header className="topnav">
          <div className="topnav__inner">
            <Link href="/" className="topnav__brand">
              BS Lern-App
            </Link>
            <nav className="topnav__links">
              <Link href="/lernen" className="navlink">
                Lernen
              </Link>
              <Link href="/pruefung" className="navlink">
                Prüfung
              </Link>
              {user ? (
                <>
                  <Link href="/fortschritt" className="navlink">
                    Fortschritt
                  </Link>
                  <Link href="/statistik" className="navlink">
                    Statistik
                  </Link>
                  <Link href="/katalog" className="navlink">
                    Katalog
                  </Link>
                  <span className="nav-user">{user.name}</span>
                  <form action="/api/auth/logout" method="post" className="nav-logout-form">
                    <button type="submit" className="btn btn--secondary btn--sm">
                      Abmelden
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="navlink">
                    Anmelden
                  </Link>
                  <Link href="/registrieren" className="btn btn--primary" style={{ minHeight: 40 }}>
                    Konto erstellen
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="footer">
          <div className="page">
            BS Lern-App · Fragenkatalog 2026 Betriebssysteme Grundlagen · Dozent: Ing. Leonard Zeh
            <br />
            Nur für Lernzwecke. Keine offizielle Veröffentlichung der Hochschule.
          </div>
        </footer>
      </body>
    </html>
  );
}