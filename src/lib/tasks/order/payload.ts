// order: Elemente in die richtige Reihenfolge bringen.

import { z } from "zod";

export const orderPayloadSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        text: z.string().min(1),
      })
    )
    .min(2),
  correctOrder: z.array(z.string().min(1)).min(2),
});

export type OrderPayload = z.infer<typeof orderPayloadSchema>;

// Public-Payload: Items ohne die korrekte Reihenfolge (gemischt).
export type OrderPublic = {
  items: { id: string; text: string }[];
};
