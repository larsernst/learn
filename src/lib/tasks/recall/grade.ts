// recall: Grading ist trivial – die Selbstbewertung des Lerners ist maßgeblich.
// Der Grader liefert das vereinheitlichte TaskResult; die Umwandlung des
// ReviewGrade in SM-2 passiert in der übergeordneten Pipeline (mcqGrade etc.).

import type { TaskResult } from "../types";
import type { RecallAttempt } from "./attempt";
import type { RecallPayload } from "./payload";

export function gradeRecall(
  _payload: RecallPayload,
  attempt: RecallAttempt
): TaskResult {
  // Bei recall korreliert „correct" mit nicht-wieder (again). Wir liefern
  // nur ein informatives correct-Flag für Statistik/Events; das tatsächliche
  // ReviewGrade wird aus attempt.grade direkt übernommen.
  return { correct: attempt.grade !== "again" };
}
