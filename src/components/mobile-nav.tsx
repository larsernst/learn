"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface MobileNavProps {
  user: { name: string; isAdmin?: boolean; isEditor?: boolean } | null;
}

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        className="mobile-nav-toggle"
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className={`hamburger ${open ? "hamburger--open" : ""}`} aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>
      {open && (
        <div className="mobile-nav-overlay" onClick={() => setOpen(false)}>
          <nav className="mobile-nav-panel" onClick={(e) => e.stopPropagation()}>
            {user && (
              <Link href="/" className="mobile-nav-link" onClick={() => setOpen(false)}>
                Übersicht
              </Link>
            )}
            {user && (
              <>
                {user.isAdmin && (
                  <Link href="/admin" className="mobile-nav-link" onClick={() => setOpen(false)}>
                    Admin
                  </Link>
                )}
                {!user.isAdmin && user.isEditor && (
                  <Link href="/admin/kurse" className="mobile-nav-link" onClick={() => setOpen(false)}>
                    Meine Kurse
                  </Link>
                )}
                <Link href="/einstellungen" className="mobile-nav-link" onClick={() => setOpen(false)}>
                  Einstellungen
                </Link>
                <span className="mobile-nav-user">{user.name}</span>
                <form action="/api/auth/logout" method="post">
                  <button type="submit" className="mobile-nav-link mobile-nav-link--logout">
                    Abmelden
                  </button>
                </form>
              </>
            )}
            {!user && (
              <>
                <Link href="/login" className="mobile-nav-link" onClick={() => setOpen(false)}>
                  Anmelden
                </Link>
                <Link
                  href="/registrieren"
                  className="mobile-nav-link mobile-nav-link--cta"
                  onClick={() => setOpen(false)}
                >
                  Konto erstellen
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}