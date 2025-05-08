
import { Module, QuizQuestion } from '@/integrations/supabase/client';

export type QuizContextType = {
  currentStep: number;
  responses: Record<number, string | string[]>;
  questions: QuizQuestion[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  recommendations: RecommendedModule[];
  userFeedback: Record<number, number>;
  modules: Module[];
  finalSelections: Module[];
  completedQuizzes: string[]; // Added this field to track completed quiz segments
  setCurrentStep: (step: number) => void;
  handleResponse: (questionId: number, response: string | string[]) => void;
  submitResponses: (quizType?: string) => Promise<void>;
  rateModule: (moduleId: number, rating: number) => Promise<void>;
  refineRecommendations: (selectedModuleIds: number[]) => Promise<void>;
  getFinalSelections: () => Promise<Module[]>;
  resetQuiz: () => void;
};

export type RecommendedModule = {
  module: Module;
  reasoning: string[];
  rating?: number;
};
