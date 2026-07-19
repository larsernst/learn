// order: Attempt = Liste von itemIds in der Reihenfolge, die der Lerner gewählt hat.

import { z } from "zod";

export const orderAttemptSchema = z.object({
  orderedIds: z.array(z.string().min(1)),
});

export type OrderAttempt = z.infer<typeof orderAttemptSchema>;
