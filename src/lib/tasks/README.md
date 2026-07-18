# Task-System

Jeder Aufgabentyp (recall, mcq, dragdrop, cloze, order, code) ist ein
**Bundle** aus fünf co-located Dateien unter `src/lib/tasks/<type>/`. Die
zentrale Anlaufstelle ist `src/lib/tasks/registry.ts` – alle API-Routen,
Serialisierung und UI konsultieren nur die Registry, nirgendwo sonst gibt es
typspezifische Switches.

## Die fünf Dateien pro Task-Typ

| Datei | Inhalt |
|---|---|
| `payload.ts` | Zod-Schema + Typ für den **autoren-seitigen** Payload (z. B. MCQ-Optionen mit `correct`). Enthält auch den Typ des **Public-Payloads** (ohne Geheimnisse). |
| `attempt.ts` | Zod-Schema + Typ für die **Lerner-Eingabe** (z. B. `selectedOptionIds`). |
| `grade.ts` | Reine Funktion `(payload, attempt) => TaskResult`. `TaskResult = { correct: boolean; detail?: unknown }`. |
| `serialize.ts` | Reine Funktion `(payload, options) => { type, payload } | null`. Stript Geheimnisse, mischt zufällige Reihenfolge. Gibt `null`, wenn der Typ für diesen Nutzer deaktiviert ist (z. B. MCQ bei `mcqEnabled=false` → Downgrade zu recall). |
| `renderer.tsx` | (unter `src/components/questions/`) React-Component für Lerner-UI. |

Optional: `index.ts` bündelt die Teile zu einer `TaskDefinition` und
exportiert sie Convenience-weise.

## Neuen Task-Typ hinzufügen

1. Neuer Ordner `src/lib/tasks/<type>/` mit `payload.ts`, `attempt.ts`,
   `grade.ts`, `serialize.ts`.
2. `<type>/index.ts` exportiert eine `TaskDefinition`-Konstante.
3. `TaskType`-Union in `src/lib/tasks/types.ts` erweitern.
4. In `src/lib/tasks/registry.ts` unter `TASK_REGISTRY` anmelden.
5. Renderer unter `src/components/questions/<Type>Renderer.tsx` + in
   `src/components/questions/registry.tsx` eintragen.
6. Optional: Editor-Form unter `src/components/questions/edit/Edit<Type>.tsx`.

Danach funktioniert der neue Typ automatisch in Lernen, Prüfung, Katalog,
Statistik und Admin-Upload – ohne Anpassung der Kern-Logik.

## Grading-Währung

Das Ergebnis jedes Graders ist `{ correct: boolean }`. Die Umwandlung in einen
SM-2-`ReviewGrade` (`again|hard|good|easy`) geschieht zentral über
`mcqGrade(correct)` (für auto-bewertete Typen) bzw. direkt durch die
Selbstbewertung bei `recall`. `applySm2`, `Sm2State` und `SM2_DEFAULTS`
bleiben task-agnostisch.

## Serialisierungs-Geheimnisse

`serialize` MUSS autor-seitige Geheimnisse strippen (z. B. `correct`-Flags bei
MCQ, akzeptierte Antworten bei Cloze, erwartete Ausgaben/versteckte Tests bei
Code). Tests unter `tests/unit/tasks/<type>.test.ts` prüfen das für jeden Typ.
