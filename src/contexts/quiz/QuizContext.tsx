
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Module, QuizQuestion } from '@/integrations/supabase/client';
import { QuizContextType } from './types';
import { useQuizQuestions } from './hooks/useQuizQuestions';
import { useModules } from './hooks/useModules';
import { useResponses } from './hooks/useResponses';
import { useRecommendations } from './hooks/useRecommendations';
import { useToast } from '@/hooks/use-toast';

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
  setCurrentStep: () => {},
  handleResponse: () => {},
  submitResponses: async () => {},
  rateModule: async () => {},
  refineRecommendations: async () => {},
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
  
  // Custom hooks
  const { questions, isLoading: questionsLoading, error: questionsError } = useQuizQuestions();
  const { modules, loadModules, error: modulesError } = useModules();
  const { responses, isSubmitting, handleResponse, submitResponses: submitUserResponses } = useResponses();
  const { 
    recommendations, 
    userFeedback, 
    finalSelections, 
    isLoading: recommendationsLoading, 
    setIsLoading,
    generateRecommendations,
    loadRecommendations,
    rateModule,
    refineRecommendations,
    getFinalSelections
  } = useRecommendations(modules);
  
  // Combined loading state
  const isLoading = questionsLoading || recommendationsLoading;
  
  // Combine errors
  useEffect(() => {
    const combinedError = questionsError || modulesError;
    setError(combinedError);
  }, [questionsError, modulesError]);
  
  // Load modules on mount
  useEffect(() => {
    loadModules();
  }, []);
  
  // Submit responses
  const submitResponses = async () => {
    try {
      setIsLoading(true);
      
      // Submit user responses and get user ID
      const userId = await submitUserResponses();
      if (!userId) {
        throw new Error("You must be logged in to submit responses");
      }
      
      // Generate recommendations
      await generateRecommendations(userId);
    } catch (err) {
      console.error("Error submitting responses:", err);
      setError(err instanceof Error ? err.message : "Failed to submit responses");
      toast({
        title: "Error",
        description: "Failed to submit your responses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset quiz
  const resetQuiz = () => {
    setCurrentStep(1);
  };
  
  // Memoize the context value to prevent unnecessary rerenders
  const contextValue = useMemo(() => ({
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
    finalSelections
  ]);
  
  return (
    <QuizContext.Provider value={contextValue}>
      {children}
    </QuizContext.Provider>
  );
};
