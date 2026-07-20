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

### Rollen & Editor

Neben `admin` gibt es die Rolle `editor` (`src/lib/roles.ts`). Editoren
dürfen eigene Kurse anlegen und bearbeiten (Kurs-Authoring unter
`/admin/kurse`); Admins sind implizit auch Editoren. Die Guards
`requireEditorApi` / `requireEditorPage` schützen die Authoring-Routen,
die fachliche Entscheidung liegt in `src/lib/course-access.ts`:

- `canViewCourse`: veröffentlichte Kurse (`status = "published"`) sieht
  jeder; Entwürfe (`"draft"`) nur Admins und der Besitzer.
- `canEditCourse`: Admins immer; Editoren nur eigene Kurse
  (`ownerId === user.sub`).

Kurs-CRUD läuft über `/api/courses` (Liste/Anlage) und
`/api/courses/[id]` (Detail/Patch/Löschen), jeweils mit
Besitzprüfung. Kurse tragen `ownerId` (Seed-Kurse: `NULL` = offiziell)
und `status` (`draft` | `published`). Darauf aufbauend:
`/api/courses/[id]/chapters*` (Curriculum), `/duplicate` (Kopie als
Entwurf ohne Fortschritte), `/export` (JSON-Download),
`/import` (Dry-Run mit Fehlerreport, Payload-Validierung,
`src/lib/course-transfer.ts`) und `/image` (Kursbild-Upload/-
Auslieferung; `imageMime`+`imageData` in der DB, Magic-Bytes-Prüfung
in `src/lib/image.ts`).

## Spaced Repetition (SM-2)

Implementiert als reine Funktionen in `src/lib/sm2.ts`. Der Algorithmus
folgt der klassischen SM-2-Variante mit vier UI-Grades
(`again / hard / good / easy`), gemappt auf SM-2-Qualitäten
(`1 / 3 / 4 / 5`). Der simpleGrading-Modus (pro Nutzer in `/einstellungen`
umschaltbar) reduziert Freitext-Fragen auf zwei Grades: **Richtig**
(`good`) und **Falsch** (`again`); MCQ bleibt unberührt. Die Intervalle
sind global auf `MAX_INTERVAL_DAYS` (aktuell 2 Tage) begrenzt.

| Grade | Repetitionen | Intervalldauer |
|---|---|---|
| again | zurück auf 0 | 0 (heute erneut) |
| good | +1 | 1 → `min(6, MAX)` → `min(prev × EF, MAX)` |
| hard | +1 | wie good, aber Ease-Faktor sinkt |
| easy | +1 | wie good, aber Ease-Faktor steigt |

Ease-Faktor startet bei 2.5 und wird je Bewertung angepasst, nach unten
begrenzt durch `SM2_DEFAULTS.easeFloor = 1.3`. Der Schwellwert „Gefestigt"
(`matureThresholdDays`, Standard = `MAX_INTERVAL_DAYS`) ist global in der
`AppSetting`-Tabelle konfigurierbar und wird über
`src/lib/settings.ts` gelesen.

Pro (User, Frage) existiert genau ein `Review`-Datensatz mit
`easeFactor`, `intervalDays`, `repetitions`, `lapses`, `dueAt`,
`lastReviewedAt`.

## Datenmodell (Prisma)

- `User`: `id`, `email` (unique), `name`, `passwordHash`, `mcqEnabled`,
  `simpleGrading`, `newQuestionsFirst`, Zeitstempel. 1—N `Review`,
  `ReviewEvent`, `UserRole`, `ownedCourses`.
- `UserRole`: `userId` + `role` (`"admin"` | `"editor"`),
  Unique-Constraint auf `(userId, role)`. Wird mit dem User kaskadiert
  gelöscht. Ermöglicht mehrere Rollen pro Nutzer.
- `AppSetting`: globale Key/Value-Konfiguration (`key` = PK, `value`,
  `updatedAt`). Aktuell belegt: `matureThresholdDays`. Pflege via
  `/admin/einstellungen`; Zugriff über `src/lib/settings.ts`.
- `Course`: `id` (String-PK), `slug` (unique), `title`, `description`,
  `order`, `ownerId` (nullable FK auf `User`, SET NULL), `status`
  (`"draft"` | `"published"`, Default `"published"`). 1—N `Question`,
  1—N `Chapter`. Löschen eines Kurses löscht Fragen und Kapitel per
  Cascade mit.
- `Chapter`: `id`, `courseId` (FK, Cascade), `slug`, `title`,
  `description`, `order`. Unique auf `(courseId, slug)`. Die flachen
  Felder `Question.chapter`/`chapterTitle` bleiben aus
  Kompatibilitätsgründen erhalten; `chapterId` verweist zusätzlich auf
  den `Chapter`-Datensatz.
- `Question`: `id` = Fragenkatalog-Slug (stabil), `courseId` (nullable,
  FK auf `Course`, CASCADE), `chapter`/`chapterTitle` (flach, Legacy),
  `chapterId` (nullable FK auf `Chapter`, SET NULL), `question`,
  `answer`, `sourceRef`, `confidence` (`"high" | "low"`),
  **`taskType` + `payload`** (siehe Task-Typen unten), `order`
  (Reihenfolge innerhalb des Kapitels, seit Migration 0015). Wird per
  `prisma/seed.ts` idempotent geseedt (`upsert`).
- `Review`: SM-2-Zustand pro User/Question (`easeFactor`,
  `intervalDays`, `repetitions`, `lapses`, `dueAt`, `lastReviewedAt`),
  Unique-Constraint auf `(userId, questionId)`, Index auf
  `(userId, dueAt)` für schnelle „fällig"-Abfragen.
- `ReviewEvent`: unveränderliches Audit-Log jeder einzelnen Bewertung
  (`grade`, `correct`, `at`). Index auf `(userId, at)` und
  `(userId, questionId)`. Speist die Statistik-Seite (Streak, Heatmap,
  Trefferquote, schwierigste Fragen).

## Frage-Auswahl

- `/api/review/next`: liefert die älteste fällige Karte, geordnet nach
  `dueAt asc`, dann `lastReviewedAt asc` – gerade bewertete Karten rutschen
  dadurch nach hinten und werden nicht sofort wiederholt (außer sie sind
  die einzige fällige). Sonst die nächste noch nie gelernte Frage, sonst
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

## Task-Typen

Fragen tragen seit Migration 0010 einen Diskriminator `taskType` und
einen typspezifischen JSON-`payload`. Sechs Typen sind implementiert:

| taskType | Inhalt | Bewertung |
|---|---|---|
| `recall` | Freie Erinnerung (Standard) | Selbsteinschätzung |
| `mcq` | Multiple-Choice (`{ options: [{ id, text, correct }] }`) | automatisch |
| `dragdrop` | Zuordnung Begriffe → Ziele | automatisch |
| `cloze` | Lückentext | automatisch |
| `order` | Reihenfolge sortieren | automatisch |
| `code` | Code-Aufgabe | Judge0 (siehe unten) |

Jeder Typ ist ein Bundle unter `src/lib/tasks/<type>/` mit
`payloadSchema`/`attemptSchema` (Zod), `grade` (rein), `serialize`
(Public-Payload ohne Lösungen) und `emptyAttempt`. Alle Bundles sind in
`src/lib/tasks/registry.ts` registriert – Handler und UIs konsultieren
nur die Registry, es gibt keine typspezifischen Switches außerhalb.
`normalizeQuestionTask` leitet für Alt-Datensätze ohne `taskType` den
Typ aus dem rohen DB-Zustand ab (Übergangsphase). Die React-Renderer
liegen unter `src/components/questions/` (`McqRenderer`,
`RecallRenderer`, `AdvancedRenderers` für dragdrop/cloze/order,
`CodeRenderer`).

Deaktiviert ein Nutzer MCQ (`mcqEnabled = false`), degenerieren
MCQ-Fragen serverseitig zu `recall` (`serializeTask` in der Registry).

## Code-Aufgaben (Judge0)

Code-Aufgaben werden optional über einen
[Judge0](https://judge0.com)-Server bewertet (`src/lib/judge0/`:
`client`, `config`, `grade`, `compare`, `languages`, `request-guard`).
Das Feature ist per `JUDGE0_ENABLED=true` plus `JUDGE0_URL`/`JUDGE0_TOKEN`
aktivierbar und läuft über das docker-compose-Profil `code` (API-Server +
Worker aus `judge0/judge0:1.13.1`, eigene PostgreSQL- und Redis-Instanz).
Alle Judge0-Dienste hängen im internen Netz `judge0-net`
(`internal: true`) – eingereichter Code erreicht weder die App-DB
(`app-net`) noch das Internet; der Server erzwingt `AUTHN_TOKEN`
(X-Auth-Token-Header). Ist das Feature deaktiviert (Default), lehnen alle
Code-Endpunkte mit 503 ab und die UI bietet den Editor nicht an.

Der Grader (`gradeCodeWithJudge0`) schickt pro Testfall eine Submission
(parallel, Concurrency 4) **ohne** `expected_output` an Judge0; der
Vergleich läuft serverseitig in `compare.ts` mit den Modi
`exact`/`trim`/`float` (Float-Toleranz, Default 1e-4). Testfälle können
`args` enthalten (Judge0 `command_line_arguments`). Submissions tragen
`enable_per_process_and_thread_{time,memory}_limit=true`
(cgroups-v2-Kompatibilität).

Endpunkte: `POST /api/review/code-submit` (bewertet, SM-2 + ReviewEvent),
`POST /api/review/code-run` (Probelauf nur öffentliche Tests, unbewertet),
`POST /api/exam/code-grade` (Prüfungsmodus: bewertet und stellt ein
HMAC-signiertes Verdict aus, das `/api/exam/submit` statt eines
Client-Flags verlangt – `src/lib/exam-verdict.ts`) und
`POST /api/courses/[id]/questions/code-check` (Autoren: Musterlösung
gegen alle Tests). Details + Autorenleitfaden:
[`CODE_TASKS.md`](CODE_TASKS.md).

## Markdown-Pipeline

Fragen- und Antworttexte sind Markdown und werden über
`src/components/markdown.tsx` gerendert: `react-markdown` mit
`remark-gfm` (Tabellen, Task-Listen), `rehype-katex` (Formeln),
`rehype-highlight` (Code-Syntax) und `rehype-sanitize` (XSS-Schutz,
läuft vor den übrigen Rehype-Plugins). Inline-Code wird separat
gestylt.

## Routing

Inhalte liegen kursbezogen unter `/kurs/[courseId]/*` mit den Tabs
Übersicht, Lernen, Prüfung, Fortschritt, Statistik und Katalog. Der
Parameter `[courseId]` akzeptiert sowohl die Course-`id` als auch den
`slug` (`resolve-course.ts`); nicht veröffentlichte Kurse liefern 404.
Alte Top-Level-Routen (`/lernen`, `/pruefung`, …) sind dynamische
Redirect-Seiten (`src/app/<route>/page.tsx`), die auf den ersten
veröffentlichten Kurs weiterleiten (`src/lib/default-course.ts`) –
`/katalog/[id]` auf den Kurs der jeweiligen Frage. Ohne Kurse führen
alle auf die Übersicht `/`.

## Design

Tokens aus `DESIGN.md` (Atlassian-Vorlage) sind in
`src/lib/design-tokens.ts` und als CSS-Variablen in
`src/app/globals.css` abgebildet. Eine primäre Aktion pro Fold
(`#1868db`, Pill-Radius `10000px`), weiße Karten mit `1px`-Hairline,
Charlie-/Inter-Schriftschnitt. Keine dritte Schrift, keine dekorativen
Farben außer dem Chart-Set für Status.