export interface McqOption {
  id: string;
  text: string;
  correct: boolean;
}

export interface McqOptionPublic {
  id: string;
  text: string;
}

export type McqSelectionMode = "single" | "multi";

export interface QuestionPublic {
  id: string;
  courseId: string | null;
  chapter: number;
  chapterTitle: string;
  question: string;
  answer: string;
  sourceRef: string;
  mcqOptions: McqOptionPublic[] | null;
  mcqSelectionMode: McqSelectionMode | null;
}

export interface ReviewNextResponse {
  review: { question: QuestionPublic } | null;
  isNew: boolean;
}

export type SettingsPatch = { mcqEnabled?: boolean; simpleGrading?: boolean };