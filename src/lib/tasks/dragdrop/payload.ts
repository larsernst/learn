// dragdrop: Elemente in Zonen ablegen. Payload enthält Zonen, Items und die
// korrekte Zuordnung (Map itemId -> zoneId).

import { z } from "zod";

export const dragdropPayloadSchema = z.object({
  zones: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
      })
    )
    .min(1),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        text: z.string().min(1),
      })
    )
    .min(1),
  correct: z.record(z.string().min(1), z.string().min(1)),
});

export type DragDropPayload = z.infer<typeof dragdropPayloadSchema>;

// Public-Payload: gleiche Struktur, aber ohne das `correct`-Feld und mit
// gemischten Item-Reihenfolgen (damit der Lerner die Position nicht ableiten kann).
export type DragDropPublic = {
  zones: { id: string; label: string }[];
  items: { id: string; text: string }[];
};
