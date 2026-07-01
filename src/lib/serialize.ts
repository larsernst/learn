import type { McqOption, QuestionPublic } from "./types";

export function stripMcq(options: McqOption[]): { id: string; text: string }[] {
  const stripped = options.map((o) => ({ id: o.id, text: o.text }));
  for (let i = stripped.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [stripped[i], stripped[j]] = [stripped[j], stripped[i]];
  }
  return stripped;
}

export function serializeQuestion(q: {
  id: string;
  chapter: number;
  chapterTitle: string;
  question: string;
  answer: string;
  sourceRef: string;
  mcqOptions: unknown;
}): QuestionPublic {
  const mcq = Array.isArray(q.mcqOptions)
    ? (q.mcqOptions as unknown as McqOption[])
    : null;
  return {
    id: q.id,
    chapter: q.chapter,
    chapterTitle: q.chapterTitle,
    question: q.question,
    answer: q.answer,
    sourceRef: q.sourceRef,
    mcqOptions: mcq ? stripMcq(mcq) : null,
  };
}