# Code-Aufgaben (Judge0)

Auto-bewertete Programmieraufgaben: Lernende schreiben Code im Browser
(CodeMirror), der serverseitig via [Judge0](https://judge0.com) gegen
Autoren-definierte Testfälle läuft.

## Betrieb

### Start

```bash
# JUDGE0_ENABLED=true und JUDGE0_TOKEN (langes Zufalls-Token) in .env setzen
docker compose --profile code up -d
```

Ohne das Profil (oder `JUDGE0_ENABLED=false`) laufen alle Code-Endpunkte in
eine saubere 503-Ablehnung, die UI zeigt Hinweise statt Editoren.

### Topologie & Sicherheit

```
app-net                          judge0-net (internal: true)
┌────────────┐                   ┌──────────────────────────────┐
│ web (Next) │── Judge0-API ───▶│ judge0-server  (API, :2358)  │
│ db (PG)    │   X-Auth-Token   │ judge0-workers (isolate)     │
└────────────┘                   │ judge0-db / judge0-redis     │
                                 └──────────────────────────────┘
```

- **Netzwerk-Isolation:** `judge0-net` ist `internal: true` – Container
  darin haben **keinen Internet-Zugriff**, und die App-DB liegt ausschließlich
  im `app-net`. Von Lernenden eingereichter Code (läuft in den Workern)
  erreicht weder die App-Datenbank noch das Internet. Verifiziert: eine
  Submission, die `db:5432` oder `8.8.8.8:53` kontaktiert, schlägt fehl.
- **Auth:** Der Judge0-Server erzwingt `AUTHN_TOKEN` (= `JUDGE0_TOKEN` aus
  `.env`); die App sendet ihn als `X-Auth-Token`-Header. Port 2358 wird
  **nicht** zum Host veröffentlicht.
- **Worker:** `judge0/judge0:1.13.1` mit `./scripts/workers`, Anzahl via
  `JUDGE0_WORKER_COUNT` (Default 2; jeder C++-Compile ≈ 1 CPU-Kern,
  Worker-RAM 0,5–1 GB). `privileged: true` ist Pflicht (isolate-Sandbox).
- **cgroups v2:** Judge0 1.13.1 nutzt für Limits cgroups v1; auf modernen
  Hosts (cgroups v2) schlägt isolate damit fehl („Internal Error,
  rb_sysopen /box/…"). Die App sendet deshalb jede Submission mit
  `enable_per_process_and_thread_time_limit=true` und
  `enable_per_process_and_thread_memory_limit=true` – dann verzichtet
  Judge0 auf cgroups und setzt Limits pro Prozess via rlimit. Funktioniert
  auf v1- und v2-Hosts. Nebenbedingung: Fork-Bomben werden durch
  Prozess-Limits + Container-Isolation + Rate-Limits (s. u.) begrenzt.
- **Rate-Limits:** `code-submit` 5/min, `code-run` 8/min,
  `exam/code-grade` 5/min, `code-check` 5/min (jeweils pro Nutzer).

### Smoke-Checkliste (manuelle Verifikation)

```bash
T="$JUDGE0_TOKEN"
# 1) API erreichbar, Auth erzwungen
docker compose --profile code exec -T judge0-server curl -s -o /dev/null -w "%{http_code}\n" http://localhost:2358/about   # → 401
docker compose --profile code exec -T judge0-server curl -s -H "X-Auth-Token: $T" http://localhost:2358/about            # → {"version":"1.13.1",…}
# 2) C++-Submission (Language-ID 54)
docker compose --profile code exec -T judge0-server curl -s -H "X-Auth-Token: $T" -H "Content-Type: application/json" \
  -d '{"language_id":54,"source_code":"#include <iostream>\nint main(){int a,b;std::cin>>a>>b;std::cout<<a+b<<\"\\n\";}","stdin":"2 40\n","enable_per_process_and_thread_time_limit":true,"enable_per_process_and_thread_memory_limit":true}' \
  "http://localhost:2358/submissions?base64_encoded=false&wait=true"   # → stdout "42\n", Accepted
# 3) Isolation: Submission darf db/Internet nicht erreichen
#    (bash, Language-ID 46; erwartete Ausgabe "BLOCKED NO-INTERNET")
```

## Architektur (Code)

| Baustein | Ort |
|---|---|
| Task-Bundle (Schema, Serialize) | `src/lib/tasks/code/` |
| Judge0-Client (Submit + Poll, X-Auth-Token, cgroup-v2-Flags) | `src/lib/judge0/client.ts` |
| Ausgabevergleich (exact/trim/float) | `src/lib/judge0/compare.ts` |
| Grading (parallel, Concurrency 4) | `src/lib/judge0/grade.ts` |
| Sprach-Allowlist | `src/lib/judge0/languages.ts` |
| Zugriffs-Vorprüfung (Sichtbarkeit/Sprache) | `src/lib/judge0/request-guard.ts` |
| Lernen: Einreichen (SM-2) / Probelauf | `POST /api/review/code-submit` / `code-run` |
| Prüfung: Bewertung mit Verdict | `POST /api/exam/code-grade` + `src/lib/exam-verdict.ts` |
| Autoren-Check (Musterlösung) | `POST /api/courses/[id]/questions/code-check` |
| Lernenden-UI | `src/components/questions/CodeRenderer.tsx` (+ `code-mirror-editor.tsx`) |
| Autoren-UI | `src/components/editor/code-editor.tsx` |

Datenfluss Einreichung: UI → `code-submit` → Guard (Login, Rate-Limit,
Kurs-Sichtbarkeit, Sprach-Allowlist) → `gradeCodeWithJudge0` (pro Testfall
eine Submission, parallel, **ohne** `expected_output` – der Vergleich läuft
in `compare.ts` serverseitig) → SM-2-Update + ReviewEvent.

Prüfungsmodus: `exam/code-grade` bewertet wie `code-submit`, schreibt aber
kein SM-2, sondern stellt ein **signiertes Verdict** aus (HMAC-SHA256 über
Frage-ID + Ergebnis + Source-Hash + Ablauf 6 h). `/api/exam/submit` wertet
nur gültige Verdicts – ein client-seitiges `correct`-Flag wird nicht
akzeptiert.

## Autorenleitfaden

### Vergleichsmodi

| Modus | Semantik | Wann |
|---|---|---|
| `exact` | Byte-gleich inkl. Zeilenumbrüche | Ausgabeformat ist exakt spezifiziert |
| `trim` | Trailing-Whitespace je Zeile + abschließende Leerzeilen egal | Standard bei `cout << " " << endl`-Stil |
| `float` | Wie trim, zusätzlich Zahlen-Tokens mit Toleranz (Default 1e-4, relativ zu `max(1, \|a\|, \|b\|)`) | Kommazahlen ohne vorgegebene Nachkommastellen |

Die erwartete Ausgabe wird beim Speichern auf genau **ein** abschließendes
`\n` normalisiert. Mismatches zeigen Lernenden die erste abweichende Zeile
(erwartet/ist) – nur bei öffentlichen Tests.

### Testfall-Felder

- **Eingabe (stdin):** wird 1:1 auf stdin geschrieben.
- **Argumente (argv, optional):** Kommandozeile (Judge0
  `command_line_arguments`), z. B. `wort1 wort2 wort3`.
- **Erwartete Ausgabe:** stdout-Vergleich nach Vergleichsmodus.
- **Versteckt:** Lernende sehen weder Ein-/Ausgabe noch Details – nur
  bestanden/nicht bestanden. Mindestens ein Test sollte öffentlich sein.

### Fallstricke (wichtig!)

1. **Exit-Code 0:** Judge0 wertet jeden Exit ≠ 0 als *Runtime Error* –
   selbst bei korrekter Ausgabe. Programme, die bei EOF mit
   `exit(EXIT_FAILURE)` enden, sind nicht bestebar. Testfälle müssen das
   Programm „sauber" enden lassen (Terminierungs-Eingabe wie `=` oder
   Leerzeile; kein nacktes EOF, wenn das Programm dann mit Fehler endet).
2. **Fehlerausgaben auf stderr:** Alles auf `cerr`/`stderr` beeinflusst den
   stdout-Vergleich nicht – im Aufgabentext explizit verlangen
   („Fehlermeldungen gehören auf `cerr`"), sonst schreiben Lernende Fehler
   auf stdout und scheitern am Vergleich.
3. **Ausgabeformat exakt spezifizieren** (Texte, Leerzeichen, Reihenfolge)
   oder `trim`/`float` wählen. Bei `float` darf das Statement die
   Nachkommastellen offen lassen.
4. **Interaktive Eingabe-Recovery:** Bei Programmen mit Fehler-Wiederholung
   (z. B. `cin.ignore(10000, '\n')`) muss jeder Fehlversuch auf einer
   **eigenen Zeile** stehen – der Rest der Zeile wird verworfen.
5. **Limits:** Standard 2 s / 256 MB reicht für C++-Übungen; Compile-Zeit
   zählt separat (Judge0-intern). Max. 20 Testfälle, 8 KB Ein-/Ausgabe pro
   Test, 64 KB Quellcode.
6. **Musterlösung pflegen + prüfen:** `referenceSolution` hinterlegen und
   vor dem Veröffentlichen „Musterlösung gegen Tests prüfen" klicken
   (braucht aktives Judge0). Die Musterlösung wird **niemals** an Lernende
   ausgeliefert. Qualitäts-Hinweise im Editor-Dashboard melden Aufgaben
   ohne Musterlösung.

### Referenz-Testfälle (mit g++ verifiziert)

Fertige Testfall-Sätze für die beiden Übungsformen (Werte mit der
Musterlösung verifiziert; **ohne** Lösungscode).

**A) Bruch-Taschenrechner (stdin, Modus `trim`):**

| Test | stdin | Erwartete Ausgabe | Sichtbarkeit |
|---|---|---|---|
| Addition | `1/2 + 3/4 =\n` | `Ergebnis: 5/4\nAls Kommazahl: 1.25\n` | öffentlich |
| Kürzen | `2/4 * 3/9 =\n` | `Ergebnis: 1/6\nAls Kommazahl: 0.166667\n` | öffentlich |
| Ganzzahlen | `5 - 7 =\n` | `Ergebnis: -2\nAls Kommazahl: -2\n` | versteckt |
| Fehler-Recovery (mehrzeilig!) | `1/0\n2/3\n+\n1/6\n=\n` | `Division durch 0 bei Bruch 1/0\nErgebnis: 5/6\nAls Kommazahl: 0.833333\n` | versteckt |

**B) Zeilenweise Mittelwerte (stdin, Modus `float`, Toleranz 1e-4):**

| Test | stdin | Erwartete Ausgabe | Sichtbarkeit |
|---|---|---|---|
| Eine Gruppe | `#Gruppe A\n1.5\n2.5\n42\n\n` | `Gruppe A: Mittelwert 15.3333\n` | öffentlich |
| Leere Gruppe | `#A\n#B\n1\n\n` | `A: Keine Messwerte\nB: Mittelwert 1\n` | versteckt |
| Fehlerzeilen (auf stderr!) | `#A\nxx\n5\n\n` | `A: Mittelwert 5\n` | versteckt |

**C) argv-Übung (Modus `exact`, stdin leer):** Test mit `args = "eins zwei eins"`,
Programm gibt häufigsten Wert + Anzahl aus – demonstriert den
Kommandozeilen-Modus (Übung-23b-Stil).

## Troubleshooting

- **Alle Einreichungen „In Queue"/Timeout:** Worker-Service läuft nicht
  (`docker compose --profile code ps`). Ohne Worker wird nichts ausgeführt.
- **„Internal Error" bei jeder Submission:** cgroups-v2-Host ohne die
  Per-Prozess-Flags (App sendet sie immer; bei eigenen Skripten mitsenden).
- **401 vom Judge0:** `JUDGE0_TOKEN` in `.env` ≠ `AUTHN_TOKEN` der
  Judge0-Container (docker-compose zieht aus derselben Variable –
  Compose neu starten: `docker compose --profile code up -d`).
- **502 „Bewertung fehlgeschlagen":** Judge0-Server nicht erreichbar
  (Profil nicht gestartet, `JUDGE0_URL` falsch). Kein SM-2-Update in
  diesem Fall.
