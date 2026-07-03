import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getCurrentUser } from "@/lib/session";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/mobile-nav";

const THEME_SCRIPT = `(function(){var t=localStorage.getItem("bs-theme")||"dark";document.documentElement.setAttribute("data-theme",t);}());`;

export const metadata: Metadata = {
  title: "Lern-App – Prüfungsfragen wiederholen",
  description:
    "Lern-Plattform fuer mehrere Kurse mit Fragenkatalogen, Spaced Repetition (SM-2) und Fortschrittsverfolgung pro Kurs und Kapitel.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <header className="topnav">
          <div className="topnav__inner">
            <Link href="/" className="topnav__brand">
              Lern-App
            </Link>
            <div className="topnav__right">
              <ThemeToggle />
              <nav className="topnav__links">
                {user && (
                  <Link href="/" className="navlink">
                    Übersicht
                  </Link>
                )}
                {user ? (
                  <>
                    <span className="nav-user">{user.name}</span>
                    <Link href="/einstellungen" className="navlink" title="Einstellungen">
                      Einstell.
                    </Link>
                    <form action="/api/auth/logout" method="post" className="nav-logout-form">
                      <button type="submit" className="nav-cta nav-cta--secondary">
                        Abmelden
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="navlink">
                      Anmelden
                    </Link>
                    <Link href="/registrieren" className="nav-cta">
                      Konto erstellen
                    </Link>
                  </>
                )}
              </nav>
              <MobileNav user={user ? { name: user.name } : null} />
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="footer">
          <div className="page">
            Lern-App · Fragenkataloge 2026
            <br />
            Nur für Lernzwecke. Keine offizielle Veröffentlichung der Hochschule.
            <br />
            <a
              href="https://github.com/larsernst/dhge-betriebssysteme"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--ds-link)" }}
            >
              GitHub
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}