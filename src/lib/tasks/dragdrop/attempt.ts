// dragdrop: Attempt = Zuordnung itemId -> zoneId (was der Lerner gewählt hat).

import { z } from "zod";

export const dragdropAttemptSchema = z.object({
  assignment: z.record(z.string().min(1), z.string()),
});

export type DragDropAttempt = z.infer<typeof dragdropAttemptSchema>;
