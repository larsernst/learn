# Architektur

## Überblick

Single-Repo-Next.js-App (App-Router, TypeScript) mit PostgreSQL als
Datenbank, Prisma als ORM, jose für signierte JWT-Session-Cookies und
bcryptjs für die Passwort-Hashing.

```
Browser ──HTTP──> Next.js (App Router)
                    │
                    ├── Pages (Server Components)
                    ├── API-Routen (Route Handlers)
                    └── Server Actions (z. B. Logout-Form)
                          │
                          ▼
                    Prisma Client ──> PostgreSQL
```

## Authentifizierung

- Registrierung: `POST /api/auth/register` → bcrypt-Hash (Cost 10) →
  User anlegen → Jose-JWT (HS256) signieren → httpOnly-Cookie setzen.
- Anmeldung: `POST /api/auth/login` → User suchen → `bcrypt.compare` →
  JWT-Cookie.
- Abmeldung: `POST /api/auth/logout` → Cookie löschen (maxAge 0).
- Aktuelle Sitzung: `src/lib/session.ts` liest Cookie verifiziert das JWT
  und liefert `{ sub, email, name }` an Server Components.

Es gibt **keine** Passwort-Reset- oder E-Mail-Verifizierungsfunktion – die
App ist ein Lernwerkzeug, kein produktives Produkt. Das Session-Geheimnis
liegt in `JWT_SECRET` (rückwärtskompatibel fällt `NEXTAUTH_SECRET` als
Fallback zurück, sollte aber für neue Deployments nicht mehr gesetzt
werden).

### Rollen & Admin

Admins werden über eine `UserRole`-Zeile (`role = "admin"`) in der
Datenbank verwaltet, **nicht** über ein Token oder eine
Umgebungsvariable. Der erste Admin wird einmalig per CLI angelegt:

```
npm run db:make-admin -- --email user@example.com
```

Weitere Admins können danach in der Admin-Oberfläche (`/admin/nutzer`)
ernannt oder entzogen werden.

`src/lib/auth.ts` liest die Rollen **bei jeder Anfrage neu aus der DB**
(`getCurrentUserWithRoles`), vertraut also nicht allein auf das JWT –
ein entzogener Admin ist sofort gesperrt. `requireAdminApi` (401/403)
und `requireAdminPage` (Redirect) schützen die Admin-Routen. Self-
Protection: ein Admin kann sich nicht selbst die Admin-Rolle entziehen
oder sich selbst löschen.

## Spaced Repetition (SM-2)

Implementiert als reine Funktionen in `src/lib/sm2.ts`. Der Algorithmus
folgt der klassischen SM-2-Variante mit vier UI-Grades
(`again / hard / good / easy`), gemappt auf SM-2-Qualitäten
(`1 / 3 / 4 / 5`).

| Grade | Repetitionen | Intervalldauer |
|---|---|---|
| again | zurück auf 0 | 0 (heute erneut) |
| good | +1 | 1 → 6 → `prev × EF` |
| hard | +1 | wie good, aber Ease-Faktor sinkt |
| easy | +1 | wie good, aber Ease-Faktor steigt |

Ease-Faktor startet bei 2.5 und wird je Bewertung angepasst, nach unten
begrenzt durch `SM2_DEFAULTS.easeFloor = 1.3`.

Pro (User, Frage) existiert genau ein `Review`-Datensatz mit
`easeFactor`, `intervalDays`, `repetitions`, `lapses`, `dueAt`,
`lastReviewedAt`.

## Datenmodell (Prisma)

- `User`: `id`, `email` (unique), `name`, `passwordHash`, `mcqEnabled`,
  Zeitstempel. 1—N `Review`, `ReviewEvent`, `UserRole`.
- `UserRole`: `userId` + `role` (z. B. `"admin"`), Unique-Constraint auf
  `(userId, role)`. Wird mit dem User kaskadiert gelöscht. Ermöglicht
  mehrere Rollen pro Nutzer.
- `Course`: `id` (String-PK), `slug` (unique), `title`, `description`,
  `order`, `published`. Neue Kurse werden in
  `prisma/seed-data/courses.ts` angelegt.
- `Question`: `id` = Fragenkatalog-Slug (stabil), `courseId` (nullable,
  FK auf `Course`, SET NULL beim Löschen), `chapter`, `chapterTitle`,
  `question`, `answer`, `sourceRef`, `mcqOptions` (JSON), `confidence`
  (`"high" | "low"`). Wird per `prisma/seed.ts` idempotent geseedt
  (`upsert`).
- `Review`: SM-2-Zustand pro User/Question (`easeFactor`,
  `intervalDays`, `repetitions`, `lapses`, `dueAt`, `lastReviewedAt`),
  Unique-Constraint auf `(userId, questionId)`, Index auf
  `(userId, dueAt)` für schnelle „fällig"-Abfragen.
- `ReviewEvent`: unveränderliches Audit-Log jeder einzelnen Bewertung
  (`grade`, `mcqCorrect`, `at`). Index auf `(userId, at)` und
  `(userId, questionId)`. Speist die Statistik-Seite (Streak, Heatmap,
  Trefferquote, schwierigste Fragen).

## Frage-Auswahl

- `/api/review/next`: liefert zuerst die älteste fällige Karte (höchste
  `lapses` zuerst), sonst die nächste noch nie gelernte Frage, sonst
  `null` („für heute erledigt"). Unterstützt `deck=difficult` (nur Karten
  mit `lapses >= 1`) und einen `courseId`-Filter.
- `/api/review/submit`: schreibt den neuen SM-2-Zustand via `upsert` und
  legt ein `ReviewEvent` an. Die Bewertung (Recall-Grade vs. MCQ-Auswahl)
  wird in der reinen Funktion `resolveReviewGrade`
  (`src/lib/review-grade.ts`) aufgelöst.

### Antwort-Sicherheit (Serialize)

Bevor eine Frage an den Client geht, filtert `src/lib/serialize.ts`
  (`stripMcq` / `serializeQuestion`) das `correct`-Flag aus den
  MCQ-Optionen heraus und mischt deren Reihenfolge. Der Client sieht also
  nie die korrekte Antwort, bevor sie bewertet wurde. Der Auswahlmodus
  (`single` bei genau einer korrekten Option, sonst `multi`) wird
  serverseitig abgeleitet.

## Routing

Inhalte liegen kursbezogen unter `/kurs/[courseId]/*` mit den Tabs
Übersicht, Lernen, Prüfung, Fortschritt, Statistik und Katalog. Der
Parameter `[courseId]` akzeptiert sowohl die Course-`id` als auch den
`slug` (`resolve-course.ts`); nicht veröffentlichte Kurse liefern 404.
Alte Top-Level-Routen (`/lernen`, `/pruefung`, …) leiten per
`next.config.js` auf den BS-Kurs weiter.

## Design

Tokens aus `DESIGN.md` (Atlassian-Vorlage) sind in
`src/lib/design-tokens.ts` und als CSS-Variablen in
`src/app/globals.css` abgebildet. Eine primäre Aktion pro Fold
(`#1868db`, Pill-Radius `10000px`), weiße Karten mit `1px`-Hairline,
Charlie-/Inter-Schriftschnitt. Keine dritte Schrift, keine dekorativen
Farben außer dem Chart-Set für Status.