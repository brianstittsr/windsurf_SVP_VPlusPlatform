export interface StudyGuideCategory {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
}

export interface StudyGuideQuestionView {
  id: string;
  categoryId: string;
  question: string;
  answers: string[];
  explanation: string;
}

export interface StudyGuideTermView {
  id: string;
  term: string;
  definition: string;
  categoryId: string;
}

export interface StudyGuideProgressView {
  answered: number;
  correct: number;
  streak: number;
  lastActivityDate: string | null;
  knownVocab: string[];
  byCategory: Record<string, { answered: number; correct: number }>;
}

export interface StudyGuideAnswerResult {
  correct: boolean;
  correctIndex: number;
  explanation: string;
}

export interface StudyGuideSessionQuestion extends StudyGuideQuestionView {
  selectedIndex: number | null;
  answered: boolean;
  result: StudyGuideAnswerResult | null;
}

export interface StudyGuideActiveSession {
  id: string;
  categoryId: string;
  currentIndex: number;
  score: number;
  startedAt: string;
  questions: StudyGuideSessionQuestion[];
}

export interface StudyGuideHistoryEntry {
  id: string;
  categoryId: string;
  questionCount: number;
  score: number;
  completedAt: string | null;
}

export interface StudyGuideData {
  categories: StudyGuideCategory[];
  questions: StudyGuideQuestionView[];
  vocabulary: StudyGuideTermView[];
  activeSessions: StudyGuideActiveSession[];
  proActive: boolean;
  history: StudyGuideHistoryEntry[];
  progress: StudyGuideProgressView;
}
