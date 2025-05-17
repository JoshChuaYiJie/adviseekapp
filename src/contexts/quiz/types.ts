
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
