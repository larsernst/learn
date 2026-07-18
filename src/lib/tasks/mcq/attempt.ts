// mcq: Attempt = gewählte Options-IDs.

import { z } from "zod";

export const mcqAttemptSchema = z.object({
  selectedOptionIds: z.array(z.string().min(1)),
});

export type McqAttempt = z.infer<typeof mcqAttemptSchema>;
