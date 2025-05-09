
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Module, QuizQuestion } from '@/integrations/supabase/client';
import { QuizContextType } from './types';
import { useResponses } from './hooks/useResponses';
import { useModules } from './hooks/useModules';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Create the context with default values
const QuizContext = createContext<QuizContextType>({
  currentStep: 1,
  responses: {},
  questions: [],
  isLoading: true,
  isSubmitting: false,
  error: null,
  recommendations: [],
  userFeedback: {},
  modules: [],
  finalSelections: [],
  completedQuizzes: [],
  setCurrentStep: () => {},
  handleResponse: () => {},
  submitResponses: async () => {},
  rateModule: async () => Promise.resolve(),
  refineRecommendations: async () => Promise.resolve(),
  getFinalSelections: async () => [],
  resetQuiz: () => {},
});

// Hook to use the Quiz context
export const useQuiz = () => useContext(QuizContext);

// Provider component
export const QuizProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { toast } = useToast();
  
  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [userFeedback, setUserFeedback] = useState<Record<number, number>>({});
  const [finalSelections, setFinalSelections] = useState<Module[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Custom hooks
  const { modules, error: modulesError } = useModules();
  const { 
    responses, 
    isSubmitting, 
    handleResponse, 
    submitResponses: submitUserResponses,
    loadResponses
  } = useResponses();
  
  // Combine errors
  useEffect(() => {
    const combinedError = modulesError;
    setError(combinedError);
  }, [modulesError]);
  
  // Check for authenticated user and load their data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id || null;
        setUserId(currentUserId);
        
        if (currentUserId) {
          // Load user's responses
          await loadResponses();
          
          // Load completed quizzes
          const { data: completions, error: completionsError } = await supabase
            .from('quiz_completion')
            .select('quiz_type')
            .eq('user_id', currentUserId);
            
          if (completionsError) {
            console.error('Error loading quiz completions:', completionsError);
          } else if (completions) {
            const completed = completions.map(c => c.quiz_type);
            setCompletedQuizzes(completed);
            
            // Update localStorage for compatibility
            localStorage.setItem('completed_quiz_segments', JSON.stringify(completed));
          }
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
      }
    };
    
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id || null;
      
      if (newUserId !== userId) {
        setUserId(newUserId);
        
        if (newUserId) {
          // If user just logged in, load their data
          loadResponses();
        }
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Submit responses
  const submitResponses = async (quizType?: string) => {
    try {
      // Submit user responses and get user ID
      const currentUserId = await submitUserResponses(quizType);
      if (!currentUserId) {
        throw new Error("You must be logged in to submit responses");
      }
      
      // Save quiz completion status
      if (quizType && currentUserId) {
        // Update local state
        setCompletedQuizzes(prev => {
          if (!prev.includes(quizType)) {
            return [...prev, quizType];
          }
          return prev;
        });
        
        // Update localStorage for compatibility
        const localCompletions = JSON.parse(localStorage.getItem('completed_quiz_segments') || '[]');
        if (!localCompletions.includes(quizType)) {
          localCompletions.push(quizType);
          localStorage.setItem("completed_quiz_segments", JSON.stringify(localCompletions));
        }
      }
    } catch (err) {
      console.error("Error submitting responses:", err);
      setError(err instanceof Error ? err.message : "Failed to submit responses");
      toast({
        title: "Error",
        description: "Failed to submit your responses. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Placeholder functions for recommendations (disabled)
  const rateModule = async (moduleId: number, rating: number): Promise<void> => {
    try {
      console.log("Rating disabled - recommendations feature is on hold");
    } catch (err) {
      console.error("Error rating module:", err);
    }
  };

  const refineRecommendations = async (selectedModuleIds: number[]): Promise<void> => {
    try {
      console.log("Refine recommendations disabled - recommendations feature is on hold");
    } catch (err) {
      console.error("Error refining recommendations:", err);
    }
  };

  const getFinalSelections = async () => {
    try {
      console.log("Get final selections disabled - recommendations feature is on hold");
      return [] as Module[];
    } catch (err) {
      console.error("Error getting final selections:", err);
      return [] as Module[];
    }
  };
  
  // Reset quiz
  const resetQuiz = () => {
    setCurrentStep(1);
  };
  
  // Memoize the context value to prevent unnecessary rerenders
  const contextValue = useMemo<QuizContextType>(() => ({
    currentStep,
    responses,
    questions,
    isLoading,
    isSubmitting,
    error: error || null,
    recommendations,
    userFeedback,
    modules,
    finalSelections,
    completedQuizzes,
    setCurrentStep,
    handleResponse,
    submitResponses,
    rateModule,
    refineRecommendations,
    getFinalSelections,
    resetQuiz,
  }), [
    currentStep, 
    responses, 
    questions, 
    isLoading, 
    isSubmitting, 
    error,
    recommendations,
    userFeedback,
    modules,
    finalSelections,
    completedQuizzes
  ]);
  
  return (
    <QuizContext.Provider value={contextValue}>
      {children}
    </QuizContext.Provider>
  );
};
