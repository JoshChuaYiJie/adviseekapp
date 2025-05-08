
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Module, QuizQuestion } from '@/integrations/supabase/client';
import { QuizContextType, RecommendedModule } from './types';
import { useQuizQuestions } from './hooks/useQuizQuestions';
import { useModules } from './hooks/useModules';
import { useResponses } from './hooks/useResponses';
import { useRecommendations } from './hooks/useRecommendations';
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
  const [userId, setUserId] = useState<string | null>(null);
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);
  
  // Custom hooks
  const { questions, isLoading: questionsLoading, error: questionsError } = useQuizQuestions();
  const { modules, loadModules, error: modulesError } = useModules();
  const { 
    responses, 
    isSubmitting, 
    handleResponse, 
    submitResponses: submitUserResponses,
    loadResponses
  } = useResponses();
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
          
          // Load user's recommendations
          await loadRecommendations(currentUserId);
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
          loadRecommendations(newUserId);
        }
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Load modules on mount
  useEffect(() => {
    loadModules();
  }, []);
  
  // Submit responses
  const submitResponses = async (quizType?: string) => {
    try {
      setIsLoading(true);
      
      // Submit user responses and get user ID
      const currentUserId = await submitUserResponses(quizType);
      if (!currentUserId) {
        throw new Error("You must be logged in to submit responses");
      }
      
      // Save quiz completion status
      if (quizType && currentUserId) {
        // Direct supabase client call since this table isn't in the types yet
        const { error: completionError } = await supabase
          .from('quiz_completion')
          .upsert({
            user_id: currentUserId,
            quiz_type: quizType,
            completed_at: new Date().toISOString()
          }, { 
            onConflict: 'user_id,quiz_type',
            ignoreDuplicates: false
          });
          
        if (completionError) {
          console.error('Error saving quiz completion:', completionError);
        }
        
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
          localStorage.setItem('completed_quiz_segments', JSON.stringify(localCompletions));
        }
      }
      
      // Generate recommendations
      await generateRecommendations(currentUserId);
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
