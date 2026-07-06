# AGENTS.md – Hinweise für KI-Agenten

## Linting / Typechecking / Tests

Vor jedem Commit sind auszuführen:

```bash
npm run typecheck      # tsc --noEmit
npm run test:unit      # Vitest
# E2E nur gegen laufende App+DB:
BASE_URL=http://<your-host>:<port> npm run test:e2e
```

`npm run lint` (`next lint`) ist verfügbar, aber nicht Teil des Pflicht-Checks.

## Architektur-Startpunkte

- SM-2-Logik: `src/lib/sm2.ts` (rein, gut getestet).
- Auth: `src/lib/session.ts` (Jose-JWT), `src/lib/password.ts` (bcryptjs).
- API-Routen: `src/app/api/**/route.ts` (Eingabevalidierung via Zod).
- Fragenkatalog-Daten: `prisma/seed-data/fragenkatalog.ts` (nur diese Datei
  enthält die Fragen/Antworten). Jede Frage trägt `courseId`.
- Kurs-Metadaten: `prisma/seed-data/courses.ts` (id, slug, title, beschreibung,
  Reihenfolge, published). Neuer Kurs → dort eintragen + Fragen in
  `fragenkatalog.ts` mit entsprechendem `courseId`.
- Design-Tokens: `src/lib/design-tokens.ts` + `src/app/globals.css`
  (Vorgabe: `DESIGN.md`).
- Prüfungsmodus: `src/lib/exam.ts` (Fragenauswahl, Bewertung).
- Ratenbegrenzung: `src/lib/rate-limit.ts` (In-Memory, ~10 Versuche/Minute/IP
  auf `/api/auth/login` und `/api/auth/register`).
- Umgebungsvariablen: `src/lib/env.ts` (erzwingt gesetztes, nicht-triviales
  `JWT_SECRET` beim Start).
- Umgebungs-Check: `.env.example` enthält alle benötigten Variablen.

## Datenbank-Workflow

```bash
npx prisma migrate dev       # Schema-Änderungen → Migration erzeugen
npm run db:generate          # Prisma Client neu generieren (auch postinstall)
npm run db:seed              # Fragenkatalog idempotent in DB schreiben (upsert)
npx prisma migrate deploy    # Produktion/CI: Migrationen ohne Drift-Prüfung
```

Prisma-Binary-Targets: `native` + `linux-musl` (für Docker-Alpine-Images).

## Wichtige Dokumentation

- `docs/ARCHITECTURE.md` – Architekturüberblick, Auth, SM-2, Datenmodell.
- `docs/TESTING.md` – Teststrategie und -abdeckung.
- `docs/LERNEN.md` – Fachliche Beschreibung des Lernalgorithmus.
- `docs/FRAGENKATALOG.md` – Konventionen für Fragen/Antworten.
- `docs/CONTENT_REVIEW.md` – Review-Prozess für Katalogänderungen.
- `DESIGN.md` – Atlassian-Design-Vorlage (externe Referenz, keine eigene
  Spec).

## Konventionen

- Sprache der UI: **Deutsch**.
- Keine Kommentare im Code, außer es wird ausdrücklich gewünscht.
  Ausnahme: `prisma/migrations/*/migration.sql` dürfen einen `--`-Header
  enthalten, der den Zweck der Migration beschreibt (Konvention 0001–0008).
- Neue Fragen/Antworten ausschließlich in `fragenkatalog.ts`pflegen,
  danach `npm run db:seed`. Neue Kurse zusätzlich in `courses.ts` anlegen.
- Kurs-Routing: Inhalte liegen unter `/kurs/[courseId]/*` (lernen, pruefung,
  fortschritt, statistik, katalog). Alte Top-Level-Routen leiten per
  `next.config.js` redirect auf den BS-Kurs weiter.
- Frage-IDs (`Question.id`) sind stabil und dürfen nie geändert werden – daran
  hängt der komplette Nutzerfortschritt (`Review`/`ReviewEvent`).
- Keine Secrets committen; `.env` ist ignoriert.
- `resources/` (Vorlesungsquellen) wird **nicht** committet.