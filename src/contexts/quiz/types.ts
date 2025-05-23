
import { Module } from "@/integrations/supabase/client";
import { McqQuestion } from "@/utils/quizQuestions";

// Type for the Quiz Context
export interface QuizContextType {
  currentStep: number;
  responses: Record<string | number, string | string[]>;
  questions: McqQuestion[]; // Changed from QuizQuestion[] to McqQuestion[]
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  recommendations: any[];
  userFeedback: Record<number, number>;
  modules: Module[];
  finalSelections: Module[];
  completedQuizzes: string[];
  debugInfo?: any; // Added debugInfo as an optional property
  setCurrentStep: (step: number) => void;
  handleResponse: (questionId: string | number, answer: string | string[]) => void;
  submitResponses: (quizType?: string) => Promise<void>;
  rateModule: (moduleId: number, rating: number) => Promise<void>;
  refineRecommendations: (selectedModuleIds: number[]) => Promise<void>;
  getFinalSelections: () => Promise<Module[]>;
  resetQuiz: () => void;
}

export interface Question {
  id: string;
  question_text: string;
  question_type: 'single-select' | 'multi-select' | 'text';
  options?: string[];
  section: string;
}

export interface QuizResponse {
  questionId: string;
  response: string | string[];
}

export interface QuizState {
  responses: Record<string, string>;
  completedQuizzes: Set<string>;
  currentQuiz: string | null;
  questions: Record<string, Question[]>;
  results: Record<string, any>;
  loading: boolean;
  error: string | null;
  currentStep: number;
  isSubmitting: boolean;
  userFeedback: Record<number, number>;
  debugInfo?: any;
}

export type QuizAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RESPONSE'; payload: { questionId: string; response: string } }
  | { type: 'SET_RESPONSES'; payload: Record<string, string> }
  | { type: 'SET_QUESTIONS'; payload: { quizType: string; questions: Question[] } }
  | { type: 'COMPLETE_QUIZ'; payload: string }
  | { type: 'SET_CURRENT_QUIZ'; payload: string | null }
  | { type: 'SET_RESULTS'; payload: { quizType: string; results: any } }
  | { type: 'RESET_QUIZ' }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_USER_FEEDBACK'; payload: Record<number, number> }
  | { type: 'SET_DEBUG_INFO'; payload: any };
