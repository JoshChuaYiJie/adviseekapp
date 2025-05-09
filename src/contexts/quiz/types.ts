
import { Module, QuizQuestion } from '@/integrations/supabase/client';

export interface QuizContextType {
  currentStep: number;
  responses: Record<number, string | string[]>;
  questions: QuizQuestion[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  recommendations: any[];
  userFeedback: Record<number, number>;
  modules: Module[];
  finalSelections: Module[];
  completedQuizzes: string[];
  debugInfo?: any; // Debug info property added
  setCurrentStep: (step: number) => void;
  handleResponse: (questionId: number, response: string | string[]) => void;
  submitResponses: (quizType?: string) => Promise<any>;
  rateModule: (moduleId: number, rating: number) => Promise<void>;
  refineRecommendations: (selectedModuleIds: number[]) => Promise<void>;
  getFinalSelections: () => Promise<Module[]>;
  resetQuiz: () => void;
}
