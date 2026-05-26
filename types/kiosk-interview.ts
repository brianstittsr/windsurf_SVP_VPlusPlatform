import { LucideIcon } from "lucide-react";

export type Language = "english" | "spanish";

export type InputType =
  | "text"
  | "date"
  | "phone"
  | "currency"
  | "single_select"
  | "multi_select"
  | "yes_no"
  | "address"
  | "checkbox";

export interface QuestionOption {
  value: string;
  labelEn: string;
  labelEs: string;
  icon?: string;
}

export interface Question {
  id: string;
  section: string;
  sectionIndex: number;
  questionIndex: number;
  labelEn: string;
  labelEs: string;
  helperTextEn?: string;
  helperTextEs?: string;
  helpExplanationEn?: string;
  helpExplanationEs?: string;
  inputType: InputType;
  icon?: string;
  options?: QuestionOption[];
  required: boolean;
  fieldPath: string; // dot-notation path into application data
  conditional?: {
    field: string;
    value: string | string[];
  };
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

export interface Section {
  id: string;
  titleEn: string;
  titleEs: string;
  descriptionEn?: string;
  descriptionEs?: string;
  questions: Question[];
}

export interface InterviewState {
  currentSectionIndex: number;
  currentQuestionIndex: number;
  language: Language;
  answers: Record<string, any>;
  completedSections: string[];
  status: "welcome" | "interview" | "section_transition" | "attestation" | "signature" | "completed";
}

export interface SectionTransitionProps {
  sectionName: string;
  remainingSections: number;
  language: Language;
  onNext: () => void;
}

export interface WelcomeScreenProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onBegin: () => void;
}

export interface QuestionScreenProps {
  question: Question;
  answer: any;
  language: Language;
  onAnswer: (value: any) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
  onHelp?: () => void;
  onAudio?: () => void;
  progress: {
    current: number;
    total: number;
    sectionProgress: number;
    sectionTotal: number;
  };
}

export interface AttestationParagraph {
  id: string;
  spanish: string;
  english: string;
}

export interface AttestationScreenProps {
  paragraph: AttestationParagraph;
  language: Language;
  onAcknowledge: () => void;
  onAudio?: () => void;
}
