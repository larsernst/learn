# BS Lern-App – Betriebssysteme Grundlagen (Fragenkatalog 2026)

![AI Assisted](https://img.shields.io/badge/AI%20Assisted-000000?style=for-the-badge&logo=opencode&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14.2-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5.18-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-2.0-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-1.45-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![CI](https://github.com/larsernst/dhge-betriebssysteme/actions/workflows/ci.yml/badge.svg)
![Status](https://img.shields.io/badge/Status-Lern--Projekt-orange?style=for-the-badge)

Eine TypeScript-/Next.js-Webanwendung zum Vorbereiten auf die DHGE-Prüfungen
„Betriebssysteme – Grundlagen" und „Rechnernetze". Die App enthält
**131 Prüfungsfragen** (100 Betriebssysteme über 6 Kapitel, 31 Rechnernetze
über 5 Kapitel) mit Modellantworten, die aus den Vorlesungsfolien erstellt
wurden, und nutzt **Spaced Repetition (SM-2)** mit freier Erinnerung
(Selbsteinschätzung) und Multiple-Choice.

> **Hinweis:** Die Quelldateien der Vorlesung liegen unter `resources/` und
> werden **nicht** in das Repository eingecheckt (siehe `.gitignore`). Die
> Fragen und Antworten sind in `prisma/seed-data/fragenkatalog.ts` als
> maschinenlesbare Daten zusammengefasst.

## Funktionsumfang

- Konto erstellen / anmelden (Passwort-Hashing mit bcryptjs, JWT-Session-Cookie).
- **Zwei Kurse**: Betriebssysteme (100 Fragen, 6 Kapitel) und Rechnernetze
  (31 Fragen, 5 Kapitel), jeweils über `/kurs/[courseId]/*` erreichbar.
- Freie Erinnerung: Frage lesen → selbst antworten → Musterantwort aufdecken →
  selbst bewerten (`Again / Hard / Good / Easy`).
- **Sechs Aufgabentypen** (`taskType` + `payload`, Registry in
  `src/lib/tasks/`): Freie Erinnerung (`recall`), Multiple-Choice (`mcq`),
  Drag&Drop-Zuordnung (`dragdrop`), Lückentext (`cloze`), Sortieren
  (`order`) und Code-Aufgaben (`code`). Alle automatisch bewerteten Typen
  mappen auf `Good` (richtig) / `Again` (falsch).
- Multiple-Choice: „Nennen Sie …"-Fragen werden als Mehrfachauswahl
  (auto-ausgewertet) angezeigt – richtig → `Good`, falsch → `Again`.
- Fragen und Antworten sind **Markdown** (GFM, KaTeX-Formeln,
  Syntax-Highlighting, sanitiert via `rehype-sanitize`).
- SM-2 Spaced-Repetition-Algorithmus plant die nächste Fälligkeit je Karte;
  falsch bewertete Karten erscheinen am selben Tag erneut.
- Prüfungsmodus (`/kurs/[courseId]/pruefung`): simuliert eine Klausur mit
  10/30/allen Fragen und optionaler SM-2-Übernahme.
- Fortschritts-Dashboard (`/kurs/[courseId]/fortschritt`): gelernt %, heute
  fällig, gefestigt, je-Kapitel-Statistik.
- Statistik-Seite (`/kurs/[courseId]/statistik`): aktuelle Serie, 12-Wochen-
  Aktivitäts-Heatmap, Ø Ease-Faktor, MCQ-Trefferquote, schwierigste Fragen.
- Katalog-Uebersicht (`/kurs/[courseId]/katalog`): alle Fragen mit Status,
  Intervalldauer, Wiederholungs- und Fehlzählung.
- **Rollenbasiertes Admin** (`/admin`): Fragen als JSON hochladen, Nutzer
  verwalten (Rollen, Passwort-Reset, Name/E-Mail, Löschen) mit Self-Protection.
- **Editor-Rolle & Kurs-Authoring** (`/admin/kurse`): Editoren legen eigene
  Kurse (Entwurf/Veröffentlicht) samt Kapiteln an und bearbeiten sie;
  Besitzprüfung serverseitig (`canEditCourse`), Admins dürfen alles.
- **Code-Aufgaben via Judge0** (optional, `docker compose --profile code`):
  Auto-Bewertung von Code-Einreichungen; deaktiviert werden Code-Aufgaben
  serverseitig abgelehnt und in der UI nicht angeboten.
- Atlassian-inspiriertes, reduziertes Design (Tokens aus `DESIGN.md`).
- Komplett dockerisiert via `docker-compose.yml` (PostgreSQL + Next.js-App).
- Unit-Tests (Vitest) für SM-2, MCQ-Auswertung, Serialize, Validierung,
  Passwort-Hashing, Session-Tokens und mehr.
- E2E-Tests (Playwright) für Lernfluss, Prüfung, Statistik, MCQ, Admin und mehr.

## Schnellstart mit Docker

```bash
# 1. Geheimnis setzen (in .env oder Shell-Umgebung)
cp .env.example .env
#JWT_SECRET auf einen langen Zufallswert setzen!

# 2. Stack bauen und starten
docker compose up --build -d

# 3. App öffnen (Port aus .env – Standard 3000)
```

Beim ersten Start führt der Container automatisch `prisma migrate deploy`
und den Seed aus, sodass die 131 Fragen beider Kurse in der Datenbank liegen.

> **Wichtig:** Beim Start prüft die App, dass `JWT_SECRET` gesetzt und kein
> Platzhalter mehr ist – sonst beendet sich der Web-Container sofort mit einer
> klaren Fehlermeldung. Trage also in `.env` einen langen Zufallswert ein.

## Sicherheit & Backups

- **Passwort-Hashing** mit bcryptjs (cost 10), **Session** als signiertes
  JWT (HS256) in einem `httpOnly`-Cookie.
- **Rollenbasiertes Admin** via `UserRole` in der Datenbank – Rollen werden
  bei jeder Anfrage neu aus der DB gelesen (ein entzogener Admin ist sofort
  gesperrt). Den ersten Admin legt man per CLI an:
  `npm run db:make-admin -- --email user@example.com`.
- **Rate-Limiting** auf `/api/auth/login`, `/api/auth/register` und
  `/api/auth/password` (≈10 Versuche/Minute pro IP, danach 429 mit
  `Retry-After`).
- **CSRF-Schutz** für `/api/auth/logout` über `Origin`/`Sec-Fetch-Site`-Check
  (optional weitere Origins über `ALLOWED_ORIGINS` in `.env`).
- **Security-Header**: `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy`, HSTS (nur bei HTTPS).
- **DB-Backups:** `sh scripts/backup-db.sh` erzeugt ein binäres
  `pg_dump`-Dump im Ordner `backups/`. Wiederherstellung:
  `docker compose exec -T db pg_restore -U lernapp -d lernapp -c < backups/<datei>.dump`
  Der `pgdata`-Volume bleibt bei `docker compose down` erhalten, nur
  `docker compose down -v` löscht die Daten.

## Lokale Entwicklung (ohne Docker)

Voraussetzungen: Node ≥ 20, eine laufende PostgreSQL-Instanz.

```bash
npm install
cp .env.example .env            # DATABASE_URL + JWT_SECRET anpassen
npx prisma migrate dev          # Schema anlegen + Client erzeugen
npm run db:seed                 # 131 Fragen beider Kurse laden
npm run dev
```

## Tests

```bash
# Unit-Tests (keine Datenbank nötig)
npm run test:unit

# E2E-Tests (App + DB müssen laufen, z. B. via docker compose)
BASE_URL=<deine-URL> npm run test:e2e
```

Details: [`docs/TESTING.md`](docs/TESTING.md).

## Projektstruktur

```
src/
  app/                  Next.js App-Router (Seiten + API-Routen)
    api/auth/           register / login / logout / me / password
    api/review/         next / submit (SM-2)
    api/exam/           questions / submit (Prüfungsmodus)
    api/progress/       Fortschritts-Aggregate
    api/settings/       MCQ-Toggle
    api/admin/          questions / users / settings (rollengeschützt)
    api/courses/        Kurs-CRUD für Editoren/Admins (Besitzprüfung)
    kurs/[courseId]/    kursbezogen: lernen / pruefung / fortschritt /
                        statistik / katalog (+ [id]-Detailansicht)
    admin/              Fragen-Upload + Nutzerverwaltung + Kurs-Authoring
    einstellungen/      MCQ-Toggle, Passwort ändern
    login|registrieren/ Auth-Seiten
  lib/
    tasks/              Aufgabentypen-Registry + Bundles (recall, mcq,
                        dragdrop, cloze, order, code): payload/attempt-
                        Schemata, grade, serialize (alles rein, getestet)
    judge0/             Judge0-Client + Auto-Bewertung für Code-Aufgaben
    sm2.ts              SM-2-Algorithmus (pure Funktionen, getestet)
    review-grade.ts     Bewertungsauflösung (Recall vs. MCQ)
    serialize.ts        Antwort-Sicherheit (stript correct-Flags)
    validation.ts       Zod-Schemata für alle API-Routen
    session.ts          Jose-JWT + httpOnly-Cookie
    password.ts         bcryptjs Hashing/Verify
    auth.ts             Rollen-Check (DB-basiert, requireAdmin*/requireEditor*)
    course-access.ts    Kurs-Sichtbarkeit/-Bearbeitbarkeit (draft/published,
                        Besitzer, Admin)
    roles.ts            Rollen-Konstanten (admin/editor), isAdmin/isEditor
    prisma.ts           Prisma-Client (Singleton)
    design-tokens.ts    Tokens aus DESIGN.md
  components/
    markdown.tsx        Markdown-Renderer (GFM, KaTeX, Highlight, Sanitize)
    questions/          Task-Renderer (Mcq, Recall, DragDrop/Cloze/Order,
                        Code)
prisma/
  schema.prisma         User / UserRole / AppSetting / Course / Chapter /
                        Question / Review / ReviewEvent
  seed.ts               Schreibt den Fragenkatalog idempotent in die DB
  seed-data/
    courses.ts          Kurs-Metadaten (id, slug, Reihenfolge, Kapitel)
    fragenkatalog.ts    131 Fragen + Antworten (Quelle: Vorlesung)
tests/
  unit/                 Vitest: sm2, serialize, review-grade, validation,
                        exam, stats, session, password, rate-limit, auth,
                        course-access, tasks/*, judge0, …
  e2e/                  Playwright: Lernfluss, Prüfung, Statistik, MCQ,
                        Admin, Mobile, Smoke
docker-compose.yml      Postgres + Web
Dockerfile              Multi-Stage-Build
DESIGN.md               Design-System-Vorgabe
docs/                   Doku (ARCHITECTURE, TESTING, LERNEN,
                        FRAGENKATALOG, CONTENT_REVIEW)
```

## Lizenz & Nutzung

Nur für persönliche Lernzwecke. Keine offizielle Veröffentlichung der
Hochschule.
