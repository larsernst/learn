// Gemeinsame Typen des Task-Systems.
//
// Ein Task-Typ ist ein Bündel aus Payload (Autor), Attempt (Lerner),
// Grading, Serialisierung (Public-Payload ohne Geheimnisse) und Renderer.
// Die reinen Logik-Teile liegen co-located unter src/lib/tasks/<type>/;
// die React-Renderer liegen unter src/components/questions/.

import type { z } from "zod";

export type TaskType = "recall" | "mcq" | "dragdrop" | "cloze" | "order";

export type TaskResult = {
  correct: boolean;
  detail?: unknown;
};

// Serialisierungs-Optionen: mcqEnabled=false (pro User) lässt MCQ-Fragen
// zu reinem Recall degenerieren (kompatibel zum alten Verhalten).
export interface SerializeOptions {
  mcqEnabled?: boolean;
}

// Konkrete Definition mit gebundenen Typen (für ein einzelnes Bundle).
export interface TaskDefinition<
  P = unknown,
  A = unknown,
  Pub = unknown
> {
  type: TaskType;
  payloadSchema: z.ZodType<P>;
  attemptSchema: z.ZodType<A>;
  grade: (payload: P, attempt: A) => TaskResult;
  serialize: (
    payload: P,
    options: SerializeOptions
  ) => { type: TaskType; payload: Pub | null } | null;
  emptyAttempt: () => A;
}

// Existential-Typ: in der Registry verlieren wir die konkreten Typ-Parameter,
// weil verschiedene Bundles unterschiedliche P/A/Pub haben. Aufrufer nutzen
// die Schemas zum sicheren Parsen, anstatt die Typen direkt zu konsumieren.
export interface AnyTaskDefinition {
  type: TaskType;
  payloadSchema: z.ZodType<any>;
  attemptSchema: z.ZodType<any>;
  grade: (payload: any, attempt: any) => TaskResult;
  serialize: (
    payload: any,
    options: SerializeOptions
  ) => { type: TaskType; payload: any } | null;
  emptyAttempt: () => any;
}
