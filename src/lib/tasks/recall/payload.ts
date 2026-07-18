// recall: Freitext-Selbstbewertung (wie bisher).
// Es gibt keinen autor-seitigen Payload – die Musterantwort ist Question.answer.
// Der Lerner gibt keinen validierbaren Versuch ab, sondern bewertet sich selbst
// (grade: again|hard|good|easy) nach Aufdecken der Musterantwort.

import { z } from "zod";

export type RecallPayload = null;

export const recallPayloadSchema = z.null();
