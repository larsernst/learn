# TODO: Code-Aufgaben (C++) – Implementierungsplan

> **Status 2026-07: ALLE PHASEN ABGESCHLOSSEN** (Branch `feature/code-aufgaben`,
> alle Pflicht-Checks grün: typecheck, coverage, integration, e2e).
> Verbleibend: manueller Release-Check mit echtem Judge0 (Checkliste in
> `docs/CODE_TASKS.md`).

Plan für die vollständige, produktionsreife Umsetzung von Programmieraufgaben.
Referenz-Beispiele: `resources/bruch-xcpt.cpp.cpp` (Übung 22: Bruchrechner mit
Exceptions) und `resources/mittelw.cpp.cpp` (Übung: zeilenweise Mittelwerte mit
Exceptions). Beide sind stdin/stdout-Programme, mit g++ 16 verifiziert.

> **`resources/` wird NICHT committed** (steht bereits in `.gitignore` und
> `.dockerignore`). Ins Repo kommen ausschließlich selbst formulierte
> Aufgabentexte, eigener Starter-Code und aus den Musterlösungen *abgeleitete*
> Testfälle (Ein-/Ausgaben, kein Lösungsquellcode).

---

## 1. Bestandsaufnahme (ist bereits vorhanden)

- Task-Typ `code` als vollwertiges Bundle (`src/lib/tasks/code/`:
  payload/attempt/grade/serialize) in der Registry.
- Judge0-Anbindung: `src/lib/judge0/` (Client mit Polling, Config via Env,
  Grader `gradeCodeWithJudge0`), unit-getestet (`tests/unit/judge0/`).
- Endpoint `POST /api/review/code-submit` (Auth, Rate-Limit 5/min,
  SM-2-Update + ReviewEvent wie beim normalen Review).
- Lernenden-UI `CodeRenderer` (Textarea, Sprachwahl, Public-Test-Anzeige,
  Test-Ergebnisliste), eingebunden in `study-client.tsx`.
- Editor-UI `src/components/editor/code-editor.tsx` (Sprache, Limit-Presets,
  Testfälle public/hidden), Payload-Builder in `src/lib/editor/payload.ts`
  (u. a. `C++ (G++)` = Judge0-Language-ID 54).
- docker-compose Profil `code` (judge0-server, judge0-redis, judge0-db).
- Serialisierung stript versteckte Tests; Deaktiviert-Pfade (503) sind
  per E2E abgesichert.

## 2. Gefundene Lücken / Probleme (Analyse 2026-07)

| # | Problem | Schwere |
|---|---------|---------|
| P1 | **Judge0-Workers fehlen** im compose-Stack: Judge0 1.13.x braucht neben `judge0/server` einen Worker-Dienst (gleiche Version). Ohne Worker bleiben Submissions ewig „In Queue" → jede Einreichung schlägt fehl. | kritisch |
| P2 | **Keine Netzwerk-Isolation:** Judge0-Worker (führen fremden Code aus!) hängen im selben Docker-Netz wie die App-PostgreSQL mit Default-Credentials `lernapp/lernapp` → eingereichter Code kann die App-DB direkt angreifen. | kritisch |
| P3 | **Judge0-Auth nicht erzwungen:** Die App schickt `Authorization: Bearer $JUDGE0_TOKEN`, aber der Judge0-Server verlangt ohne `AUTHN_TOKEN` gar kein Token → jeder Container im Netz darf submitten. | hoch |
| P4 | **Prüfungsmodus:** Code-Fragen werden in `pruefung-client.tsx` nicht gerendert (fallen auf Recall/Selbstbewertung durch), und `gradeExamAttempt` vertraut bei `code` einem client-seitig gesendeten `correct`-Flag → Schummel-Lücke + kaputte UX. | hoch |
| P5 | **Keine Kommandozeilen-Argumente:** Aufgaben wie Übung 23b (`resources/uebung23b.pdf`: Programm liest `argv`) sind nicht modellierbar. Judge0 unterstützt `command_line_arguments` bereits. | mittel |
| P6 | **Exakter Ausgabevergleich ist fragil:** `mittelw` gibt `15.3333` aus (cout-Default). Abweichende Float-Formatierung oder fehlendes/abschließendes `\n` ⇒ „Wrong Answer", obwohl fachlich richtig. | mittel |
| P7 | **Keine Längen-/Mengenlimits** in Payload/Attempt (Source-Code, stdin, erwartete Ausgabe, Anzahl Tests) → Kosten-/Missbrauchsrisiko. | mittel |
| P8 | **Sequenzielles Grading:** N Testfälle = N sequenzielle Submissions (bei C++ je ~1 s Compile) → spürbar langsam. | niedrig |
| P9 | **Kein „Probieren ohne Wertung":** Jeder Lauf ist sofort eine SM-2-Bewertung. Didaktisch ungünstig. | niedrig |
| P10 | **Editor kann Aufgaben nicht validieren:** Autoren können Starter-Code/Tests nicht gegen eine Musterlösung laufen lassen → fehleranfälliges Veröffentlichen. | niedrig |
| P11 | **CodeRenderer:** Plain-Textarea (kein Syntax-Highlighting), und Sprachwahl-State lokal vs. Props nicht sauber synchronisiert. | niedrig |
| P12 | **Exit-Code-Falle (Autorenwissen):** Die Musterlösungen beenden sich bei EOF teils mit `exit(EXIT_FAILURE)` (verifiziert: `bruch` bei `/ 0` → Exit 1). Judge0 wertet Exit ≠ 0 als Runtime Error → Test nicht bestebar. Testfälle müssen immer „sauber" enden (`=` bzw. Leerzeile). | Doku |

---

## 3. Phasenplan

### Phase 1 – Judge0-Betrieb: korrekt & sicher  *(kritisch, S)*

Behebt P1, P2, P3.

- [x] `docker-compose.yml`: Worker-Dienst ergänzen (`judge0/workers:1.13.1`,
      gleiche Env wie Server; Anzahl Worker via `COUNT` konfigurierbar).
- [x] Netzwerk-Trennung: zwei Netzwerke `app-net` (web, db) und
      `judge0-net` (judge0-server, -workers, -redis, -db); `web` in beiden,
      App-`db` **nicht** in `judge0-net`. Eingereichter Code erreicht die
      App-DB dann nicht mehr.
- [x] Judge0-Auth erzwingen: `AUTHN_TOKEN` (und falls nötig `AUTHZ_TOKEN`)
      auf Server/Worker aus `JUDGE0_TOKEN` setzen; `.env.example` anpassen.
- [x] Healthcheck für `judge0-server` (`GET /about` o. ä.),
      `depends_on` für Worker; Restart-Policies prüfen.
- [x] Smoke-Verifikation (manuell, Checkliste in `docs/CODE_TASKS.md`):
      1. Test-Submission aus dem `web`-Container → `Accepted`.
      2. Submission ohne Token → `401`.
      3. Eingereichter Code, der `db:5432`/App-DB kontaktiert → schlägt fehl.
- [x] `docs/ARCHITECTURE.md` Abschnitt Judge0 um Netzwerk-Topologie +
      Worker ergänzen; README-Schnellstart `docker compose --profile code up -d`
      verifizieren.

### Phase 2 – Validierung & Härtung  *(M)*

Behebt P7 (+ Zugriffskonsistenz).

- [x] Zod-Caps in `src/lib/tasks/code/payload.ts` + `attempt.ts`:
      `sourceCode` ≤ 64 KB, `starterCode` ≤ 64 KB, `input`/`expectedOutput`
      ≤ 8 KB, `testCases` 1–20, `languages` 1–3.
- [x] Serverseitige Language-Allowlist (Konstante in `src/lib/judge0/config.ts`,
      C++ ID 54 Pflicht); unbekannte IDs → 400.
- [x] `/api/review/code-submit`: Kurs-Sichtbarkeitsprüfung analog zu
      `review/next` (published bzw. `canViewCourse`), damit Einreichungen
      nicht an Draft-Kursen/per ID-Erraten möglich sind.
- [x] Normalisierung beim Speichern (Editor-API): `expectedOutput` auf
      genau ein abschließendes `\n` bringen (Judge0 vergleicht exakt).
- [x] Tests: Unit (Payload-Limits, Allowlist, Normalisierung) +
      Integration (Endpoint 400/403/404-Pfade). E2E-Kommentar in
      `tests/e2e/code-task.spec.ts` erweitern.

### Phase 3 – Grading: Vergleichsmodi, argv, Parallelität  *(L, Kernphase)*

Behebt P5, P6, P8.

- [x] Payload v2 (abwärtskompatibel, JSON – keine DB-Migration):
      - Pro Testfall optional `args: string` (Kommandozeile → Judge0
        `command_line_arguments`). Editor-Feld „Argumente (argv)".
      - Pro Aufgabe `comparison: { mode: "exact" | "trim" | "float",
        floatTolerance?: number }`; Default `exact` = bisheriges Verhalten
        (Schema-Default beim Parsen, Alt-Payloads bleiben gültig).
- [x] Neuer reiner Comparator `src/lib/judge0/compare.ts`:
      Submission **ohne** `expected_output` senden, `stdout` selbst
      vergleichen. Modi: `exact`; `trim` (Trailing-Whitespace je Zeile +
      finales `\n` ignorieren); `float` (zeilenweise, Tokens als Zahlen mit
      Toleranz, Rest exakt). Liefert strukturiertes Diff für die UI.
- [x] `gradeCodeWithJudge0` umbauen: Vergleich via Comparator, `args`
      durchreichen, Submissions **parallel** mit Concurrency-Limit (≈4),
      Ergebnisreihenfolge stabil. Status-Mapping (Compile/Runtime/TLE/
      Systemfehler) wie bisher, inkl. Abbruch bei Judge0-Internal-Error.
- [x] Editor (`code-editor.tsx` + `src/lib/editor/payload.ts`):
      Vergleichsmodus-Select (+ Toleranzfeld bei `float`), argv-Feld pro
      Testfall; Presets unverändert.
- [x] Tests: umfangreiche Unit-Tests für `compare.ts` (u. a. `15.3333` vs.
      `15.33333` mit Toleranz; trailing `\n`; leere Ausgabe), Grader mit
      `args`, Parallelität (Mock-Client, Reihenfolge), Schema-Defaults für
      Alt-Payloads, Editor-Builder Roundtrip. `docs/ARCHITECTURE.md` +
      AGENTS.md-Verweis aktualisieren.

### Phase 4 – Lernenden-UX  *(L)*

Behebt P9, P11.

- [x] CodeMirror 6 einbinden (`@codemirror/lang-cpp`, Basis-Setup, Theme an
      DESIGN.md-Tokens angelehnt) für den CodeRenderer; Textarea als
      No-JS-/Fallback. Bundlegröße im Blick behalten (dynamischer Import).
- [x] **„Ausführen" vs. „Einreichen":**
      - Neuer Endpoint `POST /api/review/code-run`: nur **öffentliche**
        Tests, **kein** SM-2-Update/ReviewEvent, Rate-Limit (≈6/min/User),
        gleiche Härtung wie code-submit.
      - „Einreichen & bewerten" bleibt wie bisher (alle Tests, SM-2).
      - UI: zwei Buttons, Ergebnisanzeige klar getrennt („Probelauf –
        unbewertet" vs. „Bewertung").
- [x] Ergebnis-UX: Diff erwartet/ist für öffentliche Tests, kompakter
      Compile-Fehler-Block, Laufzeit/Speicher-Badges je Test, deutsche
      Status-Texte.
- [x] Bugfix CodeRenderer: Sprachwahl-State entkoppeln (Source of Truth im
      Parent bzw. `key` pro Sprache), Starter-Code-Logik vereinfachen.
- [x] Tests: Unit (code-run Validierung/Rate-Limit-Pfade via Integration),
      Playwright: Deaktiviert-Pfade + UI-States; Live-Lauf nur als manueller
      Check (s. Phase 8).

### Phase 5 – Code-Prüfungsfluss im Prüfungsmodus  *(M–L, geändert)*

Behebt P4. **Entscheidung: Code-Fragen bleiben prüfbar**, aber die Bewertung
läuft serverseitig über Judge0 mit **signiertem Verdict** – der Client kann
sich kein `correct` mehr erschleichen, der Prüfungsfluss bleibt stateless
(kein neues DB-Modell).

- [x] Neuer Endpoint `POST /api/exam/code-grade` (Auth, Rate-Limit ≈5/min):
      Body `{ questionId, languageId, sourceCode }` → Judge0-Grading aller
      Testfälle → Antwort `{ correct, detail, verdict }`. `verdict` ist ein
      signierter JWT (jose, HS256 mit `JWT_SECRET`, Ablauf ≈6 h) mit
      `{ qid, correct, sourceHash (sha256), exp }`.
- [x] `/api/exam/submit`: Code-Attempts liefern `{ taskType: "code",
      verdict }`; `gradeExamAttempt` verifiziert Signatur, Ablauf und
      questionId-Übereinstimmung; ungültig/fehlend → `correct = false`.
      Das alte Client-Flag `correct` für `code` wird **entfernt**.
- [x] `pruefung-client.tsx`: Code-Fragen mit `CodeRenderer` rendern
      (Prüfungs-Variante: Einreichen-Button ruft `exam/code-grade`, zeigt
      Test-Ergebnis, speichert `verdict` im Attempt). Union-Typen um
      `"code"` erweitern.
- [x] Lib: `src/lib/exam-verdict.ts` (sign/verify, rein) + Unit-Tests
      (gültig, manipuliert, abgelaufen, falsche questionId).
- [x] Tests: Unit (`exam.test.ts`: code über Verdict, kein Flag-Vertrauen),
      Integration (Endpoint 401/400/503), E2E bleibt ohne Judge0 grün
      (Code-Fragen erscheinen im Demo-Katalog nicht → Fluss unverändert).
- [x] Doku: `docs/ARCHITECTURE.md` (Verdict-Flow), TESTING.md.

### Phase 6 – Autoren-/Editor-UX  *(M)*

Behebt P10.

- [x] Optionales Feld `referenceSolution` (Musterlösung) im Payload –
      **wird niemals an Lernende serialisiert** (`serialize.ts` strippen,
      Test!). Im Editor editierbar.
- [x] Editor-Endpoint `POST /api/courses/[id]/questions/code-check`
      (Editor/Admin, rate-limitiert): führt `referenceSolution` gegen alle
      Testfälle aus und zeigt das Ergebnis → Qualitäts-Gate vor dem
      Veröffentlichen.
- [x] Qualitäts-Hinweise im Editor-Dashboard: Code-Aufgabe ohne öffentlichen
      Test, ohne Musterlösung, ohne erfolgreichen Code-Check.
- [x] JSON Export/Import der neuen Felder (course-transfer) + Tests.
- [x] `docs/EDITOR.md` ergänzen.

### Phase 7 – Editor-E2E: Referenzaufgaben anlegbar  *(M, geändert)*

**Kein Demo-Kurs, keine committed Beispielaufgaben** (Auftraggeber pflegt
die Aufgaben später selbst über den Editor). Stattdessen wird nachgewiesen,
dass der Editor die zwei Referenzaufgaben vollständig abbilden kann.

- [x] Editor-E2E (`tests/e2e/`): C++-Code-Aufgabe anlegen mit Statement
      (Markdown), Starter-Code, Vergleichsmodus `trim`, öffentlichen +
      versteckten Testfällen (stdin/expected, jeweils mit abschließendem
      `\n`), Speichern → Frage erscheint im Curriculum + Katalog.
- [x] Editor-E2E: zweite Aufgabe mit argv-Testfall + Vergleichsmodus
      `float` (Toleranz) + `referenceSolution`; „Code-Check"-Button ruft
      den Editor-Endpoint (ohne Judge0: saubere 503-Meldung).
- [x] Unit-Test-Fixtures dürfen Beispiel-Payloads enthalten (bruch-/mittelw-
      artige Testfälle) – ausschließlich unter `tests/`.
- [x] Autoren-Spickzettel in `docs/CODE_TASKS.md` enthält die fertigen
      Testfall-Sätze für beide Referenzaufgaben (Ein-/Ausgaben mit g++
      verifiziert) zum Copy-Pasten in den Editor – **ohne** Lösungs-Code.
- [x] **Kein Commit von `resources/`** – abschließend `git status` prüfen.

### Phase 8 – Doku, Tests, Abschluss  *(S)*

- [x] `docs/CODE_TASKS.md` neu: Betrieb (Compose-Profil, Tokens, Netze),
      Autorenleitfaden (Ausgabeformat exakt spezifizieren; Fehlerausgaben
      auf `stderr`; Eingaben immer „sauber" beenden, Exit-Code 0 – sonst
      Judge0-Runtime-Error; Vergleichsmodi; argv; Limits; bewährte
      Testfall-Muster anhand der zwei Referenzaufgaben).
- [x] README (Funktionsumfang/Schnellstart), `docs/ARCHITECTURE.md`,
      `docs/TESTING.md`, `AGENTS.md` (falls neue Startpunkte) aktualisieren.
- [x] Pflicht-Checks laut AGENTS.md: `npm run typecheck`,
      `npm run test:coverage` (Schwellen!), `npm run test:integration`,
      `npm run test:e2e` (Deaktiviert-Pfade).
- [x] Manueller Release-Check mit `docker compose --profile code up`:
      beide Demo-Aufgaben komplett durchspielen (falsch → richtig),
      Checkliste in `docs/CODE_TASKS.md`.

---

## 4. Akzeptanzkriterien (Definition of Done)

1. `docker compose --profile code up -d` → Judge0-Stack gesund, nur mit
   Token nutzbar; eingereichter Code kann die App-DB nicht erreichen.
2. Code-Aufgaben lassen sich vollständig im Editor anlegen (Statement,
   Starter-Code, Vergleichsmodi, argv, versteckte Tests, Musterlösungs-Check)
   und im Browser lösen: Probelauf (öffentliche Tests, unbewertet) und
   Einreichung (alle Tests inkl. versteckter, SM-2-Update + ReviewEvent).
3. Versteckte Testfälle/Musterlösungen erscheinen in keiner Client-Antwort
   (Serialize-Tests).
4. Fehlerfälle (Compile, Wrong Answer, TLE, Runtime, Judge0 down) liefern
   verständliche deutsche Rückmeldungen; bei Judge0-Ausfall kein
   SM-2-Update.
5. Prüfungsmodus: Code-Fragen sind integriert, Bewertung ausschließlich
   über server-signierte Verdicts (manipulierte/fehlende Verdicts ⇒ falsch).
6. Alle Pflicht-Checks (typecheck, coverage inkl. Schwellen, integration,
   e2e) sind grün; `resources/` ist in keinem Commit.

## 5. Entscheidungen des Auftraggebers (2026-07, beantwortet)

1. **Sprachen:** System bleibt **mehrsprachig**; der Editor wählt die Sprache
   pro Aufgabe (Allowlist = alle Editor-Sprachen, nicht nur C++).
2. **Prüfungsmodus:** Es soll ein **echter Code-Prüfungsfluss** integriert
   werden (langfristig Richtung). Umsetzung in diesem Plan: Phase 5 neu –
   Code-Fragen bleiben in Prüfungen, Bewertung über **server-signierte
   Verdicts** (kein Client-vertrauenswürdiges Flag mehr).
3. **Vergleich:** Freie Wahl → es kommen **`exact` / `trim` / `float`**
   (Float-Toleranz, Default 1e-4).
4. **argv-Support:** **jetzt** (Phase 3).
5. **CodeMirror:** ja, als Editor im CodeRenderer.
6. **„Ausführen"-Button** (Probelauf ohne SM-2): ja.
7. **Musterlösungen/Seed:** **Keine** Beispielaufgaben im Repo/Seed –
   Aufgaben werden später vom Auftraggeber selbst über den **Editor** in die
   DB gepflegt. Beispiele dürfen nur in **Tests** vorkommen.
   ⇒ Phase 7 (Demo-Kurs) **entfällt**, ersetzt durch: Editor muss die zwei
   Referenzaufgaben vollständig abbilden können (E2E-Nachweis).
8. **Aufgabentexte:** Werden später selbst gepflegt (Editor) – nichts aus
   `resources/` ins Programm übernehmen.
9. **Deployment:** Judge0 läuft auf **demselben Host** wie die App.

### Konsequenzen für die Phasen

- Phase 2: Language-Allowlist = alle Sprachen aus `CODE_LANGUAGES`.
- Phase 5: **neu konzipiert** (Code-Prüfungsfluss mit signierten Verdicts,
  s. u.).
- Phase 6 (Editor-UX) steigt in der Priorität (Autorenwerkzeug für den
  Auftraggeber).
- Phase 7: **gestrichen** (kein Demo-Kurs, keine committed Musterlösungen);
  Ersatz: Editor-E2E, der das Anlegen einer C++-Code-Aufgabe mit
  Vergleichsmodi/argv/versteckten Tests durchspielt.
