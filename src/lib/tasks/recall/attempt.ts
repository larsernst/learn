// recall: Ein Attempt besteht nur aus der Selbstbewertung (grade).
// Der Freitext-Entwurf wird nicht übertragen oder serverseitig geprüft.

import { z } from "zod";

export const recallAttemptSchema = z.object({
  grade: z.enum(["again", "hard", "good", "easy"]),
});

export type RecallAttempt = z.infer<typeof recallAttemptSchema>;
