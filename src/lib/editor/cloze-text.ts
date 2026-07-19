// Lückentext-Editor: Text mit Markern [[n]] <-> Cloze-Segmente.
// Der Editor zeigt dem Autor einen einzigen Text, in dem Lücken als
// Marker [[1]], [[2]] … stehen; der Payload wird daraus geparst.

import type { ClozeNormalize, ClozeSegment } from "@/lib/tasks/cloze/payload";

export type ClozeBlankDef = {
  blankId: string;
  accepted: string[];
  normalize: ClozeNormalize;
  placeholder?: string;
};

const MARKER_RE = /\[\[(\d+)\]\]/g;

// Parst Marker-Text in Segmente. Marker ohne Blank-Definition werden als
// normaler Text belassen (defensiv gegen verwaiste Marker).
export function parseClozeText(
  text: string,
  blanks: ClozeBlankDef[]
): { segments: ClozeSegment[]; missingDefs: string[] } {
  const segments: ClozeSegment[] = [];
  const missingDefs: string[] = [];
  const byId = new Map(blanks.map((b) => [b.blankId, b]));
  let last = 0;
  for (const match of text.matchAll(MARKER_RE)) {
    const idx = match.index ?? 0;
    const blankId = match[1];
    const def = byId.get(blankId);
    if (!def) {
      missingDefs.push(blankId);
      continue;
    }
    if (idx > last) {
      segments.push({ kind: "text", text: text.slice(last, idx) });
    }
    segments.push({
      kind: "blank",
      blankId,
      accepted: def.accepted,
      normalize: def.normalize,
      ...(def.placeholder ? { placeholder: def.placeholder } : {}),
    });
    last = idx + match[0].length;
  }
  if (last < text.length) {
    segments.push({ kind: "text", text: text.slice(last) });
  }
  return { segments, missingDefs };
}

// Baut den Marker-Text aus Segmenten (Rundreise für die Bearbeitung).
export function clozeToText(segments: ClozeSegment[]): string {
  return segments
    .map((s) => (s.kind === "text" ? s.text : `[[${s.blankId}]]`))
    .join("");
}

// Blank-Definitionen aus Segmenten extrahieren (Rundreise).
export function clozeToBlankDefs(segments: ClozeSegment[]): ClozeBlankDef[] {
  return segments
    .filter((s): s is Extract<ClozeSegment, { kind: "blank" }> => s.kind === "blank")
    .map((s) => ({
      blankId: s.blankId,
      accepted: s.accepted,
      normalize: s.normalize,
      ...(s.placeholder ? { placeholder: s.placeholder } : {}),
    }));
}

// Nächste freie Marker-Nummer (kleinstes positives n ohne Definition).
export function nextBlankId(blanks: ClozeBlankDef[]): string {
  const used = new Set(blanks.map((b) => b.blankId));
  let n = 1;
  while (used.has(String(n))) n++;
  return String(n);
}

// Fügt an Position [start, end) einen neuen Marker ein und liefert
// Text + aktualisierte Blank-Liste + die neue blankId.
export function insertBlankMarker(
  text: string,
  start: number,
  end: number,
  blanks: ClozeBlankDef[]
): { text: string; blanks: ClozeBlankDef[]; blankId: string } {
  const blankId = nextBlankId(blanks);
  const selected = text.slice(start, end).trim();
  const newText = `${text.slice(0, start)}[[${blankId}]]${text.slice(end)}`;
  const newBlanks: ClozeBlankDef[] = [
    ...blanks,
    {
      blankId,
      accepted: selected ? [selected] : [],
      normalize: "ignore-case",
    },
  ];
  return { text: newText, blanks: newBlanks, blankId };
}
