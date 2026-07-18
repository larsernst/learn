// mcq: Multiple-Choice. Payload = Optionen mit correct-Flag;
// Public-Payload = Optionen ohne correct-Flag, gemischt, plus Modus.

import { z } from "zod";

export const mcqOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  correct: z.boolean(),
});

export type McqOption = z.infer<typeof mcqOptionSchema>;

export const mcqPayloadSchema = z.object({
  options: z.array(mcqOptionSchema).min(1),
});

export type McqPayload = z.infer<typeof mcqPayloadSchema>;

// Public-Payload: keine correct-Flags, dafür der abgeleitete Modus.
export type McqPublic = {
  options: { id: string; text: string }[];
  selectionMode: "single" | "multi";
};
