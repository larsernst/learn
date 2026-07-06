# Testing

Die App hat zwei Test-Schichten: **Unit-Tests** (Vitest, rein logisch) und
**End-to-End-Tests** (Playwright, gegen die laufende App + Datenbank).

## Unit-Tests (Vitest)

Gedeckter Bereich (rein logisch, ohne Datenbank):

| Datei | Getestetes Verhalten |
|---|---|
| `tests/unit/sm2.test.ts` | SM-2-Fortschreibung, Intervalldauer, Ease-Faktor-Boden, „again"-Reset, Fälligkeit |
| `tests/unit/serialize.test.ts` | `stripMcq` / `serializeQuestion`: `correct`-Flag wird entfernt (kein Answer-Leak), Auswahlmodus `single`/`multi`, MCQ-Deaktivierung |
| `tests/unit/review-grade.test.ts` | `resolveReviewGrade`: MCQ richtig/falsch, Multi-Select, Recall-Grade, fehlende Optionen |
| `tests/unit/validation.test.ts` | Alle API-Zod-Schemata (`login`, `register`, `passwordChange`, `reviewSubmit`, `examSubmit`, `adminQuestions`, `adminResetPassword`, `adminUserPatch`) |
| `tests/unit/exam.test.ts` | `shuffle`, `selectExamQuestions`, `gradeExamAttempt` |
| `tests/unit/stats.test.ts` | `computeStreak`, `buildHeatmap`, `buildLapsesLeaderboard` |
| `tests/unit/session.test.ts` | Jose-JWT Round-Trip und Token-Manipulation |
| `tests/unit/password.test.ts` | bcryptjs Hash/Verify, Salt-Eindeutigkeit |
| `tests/unit/rate-limit.test.ts` | Fixed-Window-Limit, Retry-After, `getClientIp` |
| `tests/unit/origin.test.ts` | `checkSameOrigin` (sec-fetch-site, Origin/Host, ALLOWED_ORIGINS) |
| `tests/unit/env.test.ts` | `validateJwtSecret`: kurze/fehlende/Platzhalter-Secrets |
| `tests/unit/auth.test.ts` | `isAdmin`-Rollenprüfung |
| `tests/unit/make-admin.test.ts` | CLI-Argumente und `runMakeAdmin` (Promote, --force, --list) |

Die Zod-Schemata liegen in `src/lib/validation.ts` (zentral und damit
isoliert testbar), die SM-2-Grade-Auflösung in `src/lib/review-grade.ts`.

Ausführen (keine Datenbank erforderlich):

```bash
npm install
npm run test:unit
# oder mit Abdeckung (benötigt @vitest/coverage-v8):
npx vitest run --coverage
```

## End-to-End-Tests (Playwright)

Die E2E-Tests laufen gegen die laufende App + Datenbank und decken die
Hauptflüsse ab:

| Datei | Getesteter Fluss |
|---|---|
| `tests/e2e/smoke.spec.ts` | Startseite → Registrierung → Lernen → Fortschritt → Katalog |
| `tests/e2e/learn-flow.spec.ts` | Login, falsches Passwort, Duplicate-Email-409, geschützte Routen, Logout |
| `tests/e2e/mcq-katalog.spec.ts` | MCQ-API richtig/falsch, MCQ-Karte, Katalog, MCQ-Toggle in Einstellungen |
| `tests/e2e/exam.spec.ts` | 10-Fragen-Prüfung, Ergebnis, Ansicht |
| `tests/e2e/statistik.spec.ts` | Streak/Heatmap-Aktivität, „schwieriger Stapel", Login-Redirect |
| `tests/e2e/mobile.spec.ts` | Hamburger-Nav, kein horizontaler Scroll-Überlauf |
| `tests/e2e/admin.spec.ts` | Nicht-Admin wird blockiert (401/403), /admin-Redirect |

Voraussetzung: App und Datenbank laufen. Einfach via Docker:

```bash
docker compose up --build -d
# einmal initialisieren lassen, dann:
BASE_URL=http://<your-host>:<port> npm run test:e2e
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