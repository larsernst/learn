# Testing

Die App hat zwei Test-Schichten: **Unit-Tests** (Vitest, rein logisch) und
**End-to-End-Tests** (Playwright, gegen die laufende App + Datenbank).

## Unit-Tests (Vitest)

Gedeckter Bereich (26 Testdateien, 242 Tests, rein logisch, ohne Datenbank):

| Datei | Tests | Getestetes Verhalten |
|---|---|---|
| `tests/unit/sm2.test.ts` | 18 | SM-2-Fortschreibung, Intervalldauer, Ease-Faktor-Boden, „again"-Reset, Fälligkeit, MCQ-Grade-Mapping |
| `tests/unit/serialize.test.ts` | 9 | `serializeQuestion`: `correct`-Flag wird entfernt (kein Answer-Leak), Auswahlmodus `single`/`multi`, MCQ-Deaktivierung, Optionen-Mischen |
| `tests/unit/review-grade.test.ts` | 8 | `resolveReviewGrade`: MCQ richtig/falsch, Multi-Select, Recall-Grade, fehlende Optionen |
| `tests/unit/validation.test.ts` | 28 | Alle API-Zod-Schemata (`login`, `register`, `passwordChange`, `reviewSubmit`, `examSubmit`, `adminQuestions`, `adminResetPassword`, `adminUserPatch`) |
| `tests/unit/exam.test.ts` | 8 | `shuffle`, `selectExamQuestions`, `gradeExamAttempt` |
| `tests/unit/stats.test.ts` | 12 | `computeStreak`, `buildHeatmap`, `buildLapsesLeaderboard` |
| `tests/unit/session.test.ts` | 8 | Jose-JWT Round-Trip und Token-Manipulation |
| `tests/unit/password.test.ts` | 3 | bcryptjs Hash/Verify, Salt-Eindeutigkeit |
| `tests/unit/rate-limit.test.ts` | 7 | Fixed-Window-Limit, Retry-After, `getClientIp` |
| `tests/unit/origin.test.ts` | 7 | `checkSameOrigin` (sec-fetch-site, Origin/Host, ALLOWED_ORIGINS) |
| `tests/unit/env.test.ts` | 4 | `validateJwtSecret`: kurze/fehlende/Platzhalter-Secrets |
| `tests/unit/auth.test.ts` | 7 | `isAdmin`- und `isEditor`-Rollenprüfung (Admin ist implizit Editor) |
| `tests/unit/make-admin.test.ts` | 11 | CLI-Argumente und `runMakeAdmin` (Promote, --force, --list) |
| `tests/unit/course-access.test.ts` | 13 | `canViewCourse` (published/draft, Besitzer, Admin) und `canEditCourse` (Admin, Editor-Besitz) |
| `tests/unit/tasks/recall.test.ts` | 6 | Recall-Bundle: grade, serialize, emptyAttempt |
| `tests/unit/tasks/mcq.test.ts` | 13 | MCQ-Bundle: grade (single/multi), serialize (correct-Stripping, Mischen), emptyAttempt |
| `tests/unit/tasks/dragdrop.test.ts` | 8 | Drag&Drop-Bundle: grade (Zuordnung), serialize, emptyAttempt |
| `tests/unit/tasks/cloze.test.ts` | 10 | Cloze-Bundle: grade (Lücken, Groß-/Kleinschreibung), serialize, emptyAttempt |
| `tests/unit/tasks/order.test.ts` | 7 | Order-Bundle: grade (Reihenfolge), serialize, emptyAttempt |
| `tests/unit/tasks/code.test.ts` | 21 | Code-Bundle: serialize (hidden/Musterlösung-Stripping), Payload-Limits, expectedOutput-Normalisierung, Attempt-Limits, Sprach-Allowlist |
| `tests/unit/judge0/grade.test.ts` | 9 | `gradeCodeWithJudge0`: eigener Vergleich (kein expected_output), args-Durchreichung, trim/float-Modi, Hidden-Stripping, System-Fehler, `mapWithConcurrency`-Limit |
| `tests/unit/judge0/compare.test.ts` | 19 | `compareOutput`: exact/trim/float-Semantik, Mismatch-Details (Zeile/Grund), Toleranz-Grenzfälle |
| `tests/unit/judge0/client.test.ts` | 4 | Judge0-Client: X-Auth-Token-Header, cgroup-v2-Flags, Polling, HTTP-Fehler |
| `tests/unit/exam-verdict.test.ts` | 8 | Code-Verdicts: Roundtrip, Tampering, Ablauf, fremde Frage, Müll-Strings |
| `tests/unit/editor/cloze-text.test.ts` | 6 | Marker-Text [[n]] ↔ Segmente, Lücke einfügen, Rundreisen |
| `tests/unit/editor/payload.test.ts` | 21 | Payload-Bau/Parser für die Editor-Formulare (mcq/dragdrop/order/code), Form-Validierung |
| `tests/unit/image.test.ts` | 7 | Kursbild-Validierung (MIME, Größe) und Magic-Bytes-Sniffing |
| `tests/unit/course-transfer.test.ts` | 5 | `parseCourseImport`: Export-/Listen-Format, mcqOptions-Legacy, Fehler pro Eintrag, Dubletten |
| `tests/unit/editor/quality.test.ts` | 5 | `analyzeCourseQuality`: Typ-Zählung, MCQ-/DragDrop-/Cloze-/Order-/Code-Unvollständigkeiten |

Die Zod-Schemata liegen in `src/lib/validation.ts` (zentral und damit
isoliert testbar), die SM-2-Grade-Auflösung in `src/lib/review-grade.ts`.

Ausführen (keine Datenbank erforderlich):

```bash
npm install
npm run test:unit
# oder mit Abdeckung (benötigt @vitest/coverage-v8):
npm run test:coverage
```

Coverage-Schwellen (`vitest.config.ts`): 75 % Lines / 88 % Branches /
70 % Functions auf `src/lib` – knapp unter dem Ist-Stand, damit die
Abdeckung nicht unbemerkt absinkt. In der CI läuft `npm run test:coverage`.

## Integrations-Tests (Vitest + PostgreSQL)

`tests/integration/` prüft Seed- und Migrations-Verhalten sowie API-Routen
gegen eine echte PostgreSQL-Datenbank:

| Datei | Getestetes Verhalten |
|---|---|
| `tests/integration/migrate-data.test.ts` | Frische DB ohne vorbelegten Kurs, Orphan-Zuweisung an den Standardkurs, Chapter-Backfill ohne Early-Return |
| `tests/integration/seed.test.ts` | Seed lädt 2 Kurse/11 Kapitel/131 Fragen, Idempotenz, Schema-Konformität aller Payloads, MCQ-Flags |
| `tests/integration/chapters.test.ts` | Kapitel-Datenmodell (Unique-Slug, Reorder-Transaktionen, Lösch-Entkopplung, Question.order) |
| `tests/integration/course-transfer.test.ts` | duplicateCourse, applyCourseImport (Kapitel-Mapping, Idempotenz, Code-Payload-v2-Felder überleben den Import) |
| `tests/integration/code-submit.test.ts` | `POST /api/review/code-submit`: 401/400/404/502/503, Sprach-Allowlist + Aufgaben-Angebot, Draft-Sichtbarkeit, SM-2/ReviewEvent (Judge0 gemockt) |
| `tests/integration/code-run.test.ts` | `POST /api/review/code-run`: nur öffentliche Tests, kein SM-2/ReviewEvent, 400 ohne öffentliche Tests |
| `tests/integration/exam-code.test.ts` | `POST /api/exam/code-grade` stellt verifizierbare Verdicts aus; `/api/exam/submit` wertet nur gültige Verdicts (echtes/gefälschtes/leeres), SM-2-Übernahme |
| `tests/integration/code-check.test.ts` | `POST /api/courses/[id]/questions/code-check`: 401/403/404/503/400, Musterlösung gegen alle Tests inkl. argv |

Die Tests nutzen eine eigene Datenbank (`INTEGRATION_DATABASE_URL`, sonst
`DATABASE_URL` + Suffix `_integration`), legen sie bei Bedarf an, migrieren
sie und räumen per `TRUNCATE` auf. Ohne erreichbare Datenbank überspringen
sie sich selbst.

```bash
docker compose up -d db
npm run test:integration
```

In der CI laufen sie im `e2e`-Job (dort existiert ein Postgres-Service).

## End-to-End-Tests (Playwright)

Die E2E-Tests laufen gegen die laufende App + Datenbank und decken die
Hauptflüsse ab (16 Spezifikationen, 54 Tests):

| Datei | Getesteter Fluss |
|---|---|
| `tests/e2e/smoke.spec.ts` | Startseite → Registrierung → Lernen → Fortschritt → Katalog; Login-Formular |
| `tests/e2e/learn-flow.spec.ts` | Login, falsches Passwort, Duplicate-Email-409, geschützte Routen, Logout |
| `tests/e2e/mcq-katalog.spec.ts` | MCQ-API richtig/falsch, MCQ-Karte, Katalog, MCQ-Toggle in Einstellungen |
| `tests/e2e/exam.spec.ts` | 10-Fragen-Prüfung komplett durchlaufen (MCQ + Recall), Ergebnis, SM-2-Übernahme; Login-Redirect; Katalog-Vorschau (Cram) |
| `tests/e2e/statistik.spec.ts` | Streak/Heatmap-Aktivität, „schwieriger Stapel", Login-Redirect |
| `tests/e2e/mobile.spec.ts` | Hamburger-Nav, kein horizontaler Scroll-Überlauf |
| `tests/e2e/admin-rejection.spec.ts` | Nicht-Admin bekommt keinen Admin-API-Zugriff (401/403), /admin-Redirect |
| `tests/e2e/admin.setup.ts` + `admin.spec.ts` | Admin anlegen (Setup-Projekt mit Storage-State), dann: Nutzerliste, Suche, Self-Protection (Rolle entziehen/löschen), fremden Nutzer bearbeiten |
| `tests/e2e/code-task.spec.ts` | Code-Submit/-Run und exam/code-grade bei deaktiviertem Judge0: 503 mit Fehlermeldung (samt 401 ohne Login) |
| `tests/e2e/editor.setup.ts` + `editor.spec.ts` | Editor-Rolle (Setup): Dashboard, Kurs anlegen → Curriculum → Frage anlegen → Einstellungen; Seed-Kurse unsichtbar |
| `tests/e2e/editor-access.spec.ts` | Editor-Zugriffsschutz: anon → /login, Normaluser → /, /admin/kurse → /editor |
| `tests/e2e/curriculum.spec.ts` | Kapitel anlegen/umbenennen/sortieren/löschen, Fragen verschieben/sortieren, Reload-Persistenz |
| `tests/e2e/question-editor.spec.ts` | Geführte Editoren pro Typ: MCQ (Badges, Vorschau-Grading), Cloze (Wort→Lücke, Vorschau), DragDrop/Order (Katalog+Lern-Tab), Code (Presets, Judge0-Hinweis) |
| `tests/e2e/code-editor.spec.ts` | Code-Aufgaben komplett im Editor anlegen: C++ mit trim/public+hidden, float+argv+Musterlösung; Speichern → Wiederöffnen persistiert alle Felder |
| `tests/e2e/course-workflow.spec.ts` | Einstellungen (Slug-Kollision), Duplizieren, Export-Download, Import (Dry-Run+Fehlerreport+Anwenden), Kursbild (Upload/Anzeige/Entfernen) |
| `tests/e2e/curriculum-extras.spec.ts` | Bulk-Aktionen (verschieben/löschen), Suche/Typ-Filter, Qualitäts-Hinweise auf dem Dashboard |

Hinweis zum MCQ-Fluss in E2E-Tests: der Submit-Button des `McqRenderer`
heißt erst **nach** Auswahl einer Option „Bestätigen & nächste" bzw.
„Auswerten" (vorher „Bitte Optionen wählen"). Tests müssen daher zuerst
eine Option per `.mcq-option input` anhaken und dann den Button klicken.

Voraussetzung: App und Datenbank laufen. Für wiederholbare lokale Läufe
muss der App-Server mit `DISABLE_RATE_LIMIT=true` gestartet werden
(sonst scheitern nach mehreren Läufen Login-/Register-Tests am
Rate-Limit – in der CI ist die Variable gesetzt). Einfach via Docker:

```bash
docker compose up --build -d
# einmal initialisieren lassen, dann:
BASE_URL=http://<your-host>:<port> npm run test:e2e
```

Lokal ohne Docker:

```bash
DISABLE_RATE_LIMIT=true npm run dev   # App-Server
npm run test:e2e                      # zweites Terminal
```

Die Tests verwenden pro Lauf eine eindeutige E-Mail, sodass sie
wiederholbar sind. In der CI wird ein separater Postgres-Service und ein
gebauter App-Server hochgefahren (siehe `.github/workflows/ci.yml`,
Job `e2e`).

## Test-freundliche Architektur

- SM-2 ist als reine Funktionen in `src/lib/sm2.ts` implementiert (keine
  Nebeneffekte, Zeit steuerbar via Parameter), daher ohne Datenbank testbar.
- Passwort- und Session-Logik sind isoliert nutzbar.
- API-Routen validieren Eingaben mit `zod` und liefern deterministische
  HTTP-Status, was stabile E2E-Assertions erlaubt.