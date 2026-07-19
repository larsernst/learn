// code: Attempt = eingereichter Quellcode + gewählte Sprache.

import { z } from "zod";

export const codeAttemptSchema = z.object({
  languageId: z.number().int().positive(),
  sourceCode: z.string().min(1),
});

export type CodeAttempt = z.infer<typeof codeAttemptSchema>;
