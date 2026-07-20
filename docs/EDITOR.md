# Editor-Bedienkonzept

Der Editor (`/editor`) ist der Arbeitsbereich für Kurs-Autoren (Rolle
`editor` oder `admin`). Er folgt dem Aufbau klassischer Kurs-Webseiten:
**Dashboard → Kurs → Curriculum (Kapitel + Fragen)**.

## Rollen & Sichtbarkeit

- **Editoren** sehen und bearbeiten nur ihre **eigenen** Kurse
  (`ownerId`). **Admins** sehen alle Kurse.
- Kurse haben den Status **Entwurf** (nur für Besitzer + Admins) oder
  **Veröffentlicht** (für alle Lernenden). Idealer Workflow: als Entwurf
  aufbauen, dann veröffentlichen.
- Der erste Admin wird per CLI angelegt
  (`npm run db:make-admin -- --email …`); weitere Editoren ernennt ein
  Admin unter `/admin/nutzer`.

## Dashboard (`/editor`)

- Kurs-Karten mit Kursbild, Status, Kapitel-/Fragenzahl,
  **Typ-Verteilung** (z. B. „MCQ: 4 · Lücke: 2") und
  **Qualitäts-Hinweisen** (z. B. „MCQ ohne richtige Option",
  „3 nicht zugeordnet").
- „Neuen Kurs anlegen" führt direkt in den Curriculum-Builder.

## Curriculum-Builder (`/editor/kurs/[id]`)

Zweispaltig (mobil einspaltig):

- **Links: Kapitel** – anlegen (Eingabe unten), inline umbenennen (✎),
  sortieren (Drag & Drop oder ↑/↓), löschen (✕, mit Warnung: Fragen
  bleiben erhalten und landen unter **„Nicht zugeordnet"**).
- **Rechts: Fragen des aktiven Kapitels** – mit Typ-Badges,
  Suche/Typ-Filter, Sortieren (↑/↓, persistent), **Bearbeiten**
  (voller Editor inkl. Payload), **Duplizieren** (⧉), **Verschieben**
  (Kapitel-Dropdown), **Löschen**.
- **Bulk-Aktionen**: Checkboxen an den Zeilen → gemeinsam in ein
  Kapitel verschieben oder löschen.

## Fragen-Editor (geführt)

„Neue Frage" oder „Bearbeiten" öffnet denselben Editor:

1. **Aufgabentyp** als Karten (nur beim Anlegen): Freie Erinnerung,
   Multiple-Choice, Zuordnen, Lückentext, Sortieren, Code-Aufgabe –
   mit Erklärung und „geeignet für …".
2. **Markdown-Felder** für Frage/Musterantwort: Werkzeugleiste (fett,
   kursiv, `code`, Codeblock mit Sprache, Link, Liste, Tabelle,
   KaTeX inline/block) + **Live-Vorschau** im echten Renderer +
   KaTeX-Spickzettel.
3. **Typ-spezifischer Bereich** mit Inline-Validierung (z. B.
   „mindestens eine richtige Option"):
   - MCQ: sortierbare Optionen, korrekt-Häkchen, Single/Multi-Badge.
   - Zuordnen: Zonen mit Farb-Chips, Elemente per Dropdown zuordnen.
   - Lückentext: **Wort markieren → „Aus Auswahl Lücke machen"** –
     Marker `[[n]]` im Text; pro Lücke akzeptierte Antworten +
     Normalisierung (Groß-/Kleinschreibung, exakt, trim, Regex).
   - Sortieren: nummerierte Liste in korrekter Reihenfolge.
   - Code: Sprache (kuratiert), Starter-Code, Testfälle
     (öffentlich/versteckt, stdin + optional argv), Vergleichsmodus
     (exakt/Whitespace-/Float-tolerant samt Toleranz), Limit-Presets,
     optionale **Musterlösung** mit „Musterlösung gegen Tests prüfen"
     (Judge0-Lauf aller Tests direkt aus dem Formular; bei deaktiviertem
     Judge0 deaktiviert + Hinweis). Die Musterlösung wird niemals an
     Lernende ausgeliefert. Details: [`CODE_TASKS.md`](CODE_TASKS.md).
4. **„Als Lernender testen"**: echte Lernenden-Renderer mit
   client-seitiger Bewertung (ohne Server, ohne SM-2-Eintrag).
5. Speichern / **„Speichern & nächste Frage"** / Strg+Enter.
   Entwürfe landen automatisch im Browser (localStorage) und lassen
   sich nach Abbruch wiederherstellen.

## Kurs-Einstellungen (`/editor/kurs/[id]/einstellungen`)

- **Metadaten**: Titel, Slug (URL-Pfad, Kollisions-Prüfung),
  Reihenfolge (Sortierung auf der Startseite), Beschreibung, Status.
- **Kursbild**: PNG/JPEG/WebP ≤ 2 MB; erscheint auf Dashboard,
  Startseite und Kurs-Header.
- **Aktionen**: **Duplizieren** (Kopie als Entwurf, ohne
  Nutzerfortschritte), **Export als JSON** (Kurs + Kapitel + Fragen,
  Format `lernapp-course@1`).
- **Import (JSON)**: Datei wählen → **Dry-Run-Report** (Fehler pro
  Eintrag, inkl. Payload-Validierung) → anwenden. Kapitel werden per
  Slug gemappt oder neu angelegt; Import ist idempotent (upsert).
- **Gefahrenzone**: Kurs löschen (entfernt Fragen, Kapitel und
  Fortschritte unwiderruflich).
