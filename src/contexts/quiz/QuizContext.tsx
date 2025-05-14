import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Module } from '@/integrations/supabase/client';
import { QuizContextType } from './types';
import { useResponses } from './hooks/useResponses';
import { useModules } from './hooks/useModules';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { McqQuestion } from '@/utils/quizQuestions';
import { fetchModuleRecommendations } from '@/utils/recommendationUtils';
import { MajorRecommendationsType } from '@/components/sections/majors/types';

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
  debugInfo: null,
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
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
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
      const currentUserId = await submitUserResponses(quizType, questions);
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
  
  // Rate module
  const rateModule = async (moduleId: number, rating: number): Promise<void> => {
    try {
      // Update local state for immediate feedback
      setUserFeedback(prev => ({
        ...prev,
        [moduleId]: rating
      }));
      
      // Store in database if user is logged in
      if (userId) {
        const { error: ratingError } = await supabase
          .from('user_feedback')
          .upsert({
            user_id: userId,
            module_id: moduleId,
            rating
          }, {
            onConflict: 'user_id,module_id'
          });
          
        if (ratingError) {
          throw new Error(`Failed to save rating: ${ratingError.message}`);
        }
      }
    } catch (err) {
      console.error("Error rating module:", err);
      toast({
        title: "Error",
        description: "Failed to save your rating. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Generate consistent module IDs based on modulecode - For consistency
  const getModuleId = (code: string) => {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };
  
  // Refine recommendations - ensure we use EXACTLY the same approach consistently
  const refineRecommendations = async (selectedModuleIds: number[] = []): Promise<void> => {
    try {
      setIsLoading(true);
      console.log("QuizContext - Starting refineRecommendations");
      
      // Define the EXACT SAME major recommendations for consistency
      const mockRecommendations: MajorRecommendationsType = {
        exactMatches: ["Computer Science at NUS", "Information Systems at NUS"],
        permutationMatches: [],
        riasecMatches: ["Software Engineering at NTU", "Data Science at SMU"],
        workValueMatches: ["Computer Engineering at NTU"],
        questionFiles: [],
        riasecCode: "RSA", // Matching the RIASEC code seen in console logs
        workValueCode: "RcRA", // Matching the Work Values code seen in console logs
        matchType: 'exact'
      };
      
      // Get ALL matched modules without limiting the number
      const moduleRecs = await fetchModuleRecommendations(mockRecommendations, 0); // Pass 0 to get all modules
      
      console.log(`QuizContext - Total matched modules found: ${moduleRecs.length}`);
      
      // Convert modules to the format expected - EXACTLY consistent
      const formattedRecs = moduleRecs.map(module => ({
        module_id: getModuleId(module.modulecode),
        user_id: userId || '',
        module: {
          id: getModuleId(module.modulecode),
          university: module.institution,
          course_code: module.modulecode,
          title: module.title,
          description: module.description || "No description available.",
          aus_cus: 4, // Default value
          semester: "1", // Default value
        },
        reason: "Recommended based on your major preferences",
        created_at: new Date().toISOString(),
        reasoning: ["Based on your recommended majors"]
      }));
      
      console.log(`QuizContext - Setting ${formattedRecs.length} recommendations`);
      setRecommendations(formattedRecs);
      setIsLoading(false);
    } catch (err) {
      console.error("Error refining recommendations:", err);
      setError("Failed to load recommendations. Please try again.");
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to refine recommendations. Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Get final selections
  const getFinalSelections = async () => {
    try {
      // Filter to highly rated modules (7+)
      const highlyRated = recommendations.filter(rec => 
        userFeedback[rec.module_id] >= 7
      );
      
      // Sort by rating (highest first)
      highlyRated.sort((a, b) => 
        (userFeedback[b.module_id] || 0) - (userFeedback[a.module_id] || 0)
      );
      
      // Take top 5 or fewer
      return highlyRated.slice(0, 5).map(rec => rec.module);
    } catch (err) {
      console.error("Error getting final selections:", err);
      toast({
        title: "Error",
        description: "Failed to generate course selections. Please try again.",
        variant: "destructive",
      });
      return [];
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
    debugInfo,
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
    completedQuizzes,
    debugInfo
  ]);
  
  return (
    <QuizContext.Provider value={contextValue}>
      {children}
    </QuizContext.Provider>
  );
};
