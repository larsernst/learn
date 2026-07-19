// cloze: Lückentext. Ein Text mit Lücken-Platzhaltern; jede Lücke hat eine
// Liste akzeptierter Antworten und eine Normalisierungs-Strategie.

import { z } from "zod";

export const clozeNormalizeSchema = z.enum(["exact", "ignore-case", "trim", "regex"]);
export type ClozeNormalize = z.infer<typeof clozeNormalizeSchema>;

// Ein Segment ist entweder normaler Text oder eine Lücke (blank).
export const clozeSegmentSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), text: z.string() }),
  z.object({
    kind: z.literal("blank"),
    blankId: z.string().min(1),
    accepted: z.array(z.string().min(1)).min(1),
    normalize: clozeNormalizeSchema,
    placeholder: z.string().optional(),
  }),
]);

export const clozePayloadSchema = z.object({
  segments: z.array(clozeSegmentSchema).min(1),
});

export type ClozePayload = z.infer<typeof clozePayloadSchema>;
export type ClozeSegment = z.infer<typeof clozeSegmentSchema>;

// Public-Payload: gleiche Struktur, aber accepted-Antworten werden nicht
// übertragen (sonst könnte der Lerner sie einfach auslesen).
export type ClozePublic = {
  segments: Array<
    | { kind: "text"; text: string }
    | { kind: "blank"; blankId: string; placeholder?: string }
  >;
};
