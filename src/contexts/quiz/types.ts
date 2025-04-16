
import { Module, QuizQuestion } from '@/integrations/supabase/client';

// Define types for our quiz context
export interface QuizContextType {
  currentStep: number;
  responses: Record<number, string | string[]>;
  questions: QuizQuestion[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  recommendations: {
    module_id: number;
    reason: string;
    module?: Module;
  }[];
  userFeedback: Record<number, number>;
  modules: Module[];
  finalSelections: {module: Module, reason: string}[];
  setCurrentStep: (step: number) => void;
  handleResponse: (questionId: number, response: string | string[]) => void;
  submitResponses: () => Promise<void>;
  rateModule: (moduleId: number, rating: number) => Promise<void>;
  refineRecommendations: () => Promise<void>;
  getFinalSelections: () => Promise<{module: Module, reason: string}[]>;
  resetQuiz: () => void;
}
