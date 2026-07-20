// code: Attempt = eingereichter Quellcode + gewählte Sprache.

import { z } from "zod";
import { CODE_SOURCE_MAX } from "./payload";

export const codeAttemptSchema = z.object({
  languageId: z.number().int().positive(),
  sourceCode: z.string().min(1).max(CODE_SOURCE_MAX),
});

export type CodeAttempt = z.infer<typeof codeAttemptSchema>;
