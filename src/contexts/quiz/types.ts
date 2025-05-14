
import { McqQuestion } from '@/utils/quizQuestions';
import { Module } from '@/integrations/supabase/client';

export interface QuizContextType {
  currentStep: number;
  responses: Record<string | number, string | string[]>;
  questions: McqQuestion[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  recommendations: any[];
  userFeedback: Record<number, number>;
  modules: Module[];
  finalSelections: Module[];
  completedQuizzes: string[];
  debugInfo: any;
  
  // Methods
  setCurrentStep: (step: number) => void;
  handleResponse: (questionId: string | number, value: string | string[]) => void;
  submitResponses: (quizType?: string) => Promise<void>;
  rateModule: (moduleId: number, rating: number) => Promise<void>;
  refineRecommendations: (selectedModuleIds?: number[]) => Promise<void>;
  getFinalSelections: () => Promise<Module[]>;
  resetQuiz: () => void;
  navigateToPath: (path: string) => void; // New navigation method
}

// Add any other quiz-related types here
