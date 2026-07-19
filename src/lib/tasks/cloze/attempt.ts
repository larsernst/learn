// cloze: Attempt = Map blankId -> eingegebener Text.

import { z } from "zod";

export const clozeAttemptSchema = z.object({
  answers: z.record(z.string().min(1), z.string()),
});

export type ClozeAttempt = z.infer<typeof clozeAttemptSchema>;
