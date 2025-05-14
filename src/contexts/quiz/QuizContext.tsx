
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { McqQuestion } from '@/utils/quizQuestions';
import { QuizContextType } from './types';
import { Module } from '@/integrations/supabase/client';

// Remove the useNavigate import since we'll handle navigation differently

// Create the context with undefined as initial value
const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error("useQuiz must be used within a QuizProvider");
  }
  return context;
};

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Remove the navigate constant - we'll use window.location for necessary redirects
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [responses, setResponses] = useState<Record<string | number, string | string[]>>({});
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [userFeedback, setUserFeedback] = useState<Record<number, number>>({});
  const [modules, setModules] = useState<Module[]>([]);
  const [finalSelections, setFinalSelections] = useState<Module[]>([]);
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Parse currentStep from the URL path
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/quiz/interest-part')) {
      const step = parseInt(path.split(' ')[1], 10);
      if (!isNaN(step)) {
        setCurrentStep(step);
      }
    }
  }, [location.pathname]);

  // Load questions from JSON and user responses from DB
  useEffect(() => {
    const loadQuestionsAndResponses = async () => {
      setIsLoading(true);
      try {
        // Load questions based on current step
        let questionsJsonPath = '';
        if (currentStep === 1) {
          questionsJsonPath = '/quiz_refer/Mcq_questions/RIASEC_interest_questions_pt1.json';
        } else if (currentStep === 2) {
          questionsJsonPath = '/quiz_refer/Mcq_questions/RIASEC_interest_questions_pt2.json';
        } else if (currentStep === 3) {
          questionsJsonPath = '/quiz_refer/Mcq_questions/RIASEC_competence_questions.json';
        } else if (currentStep === 4) {
          questionsJsonPath = '/quiz_refer/Mcq_questions/Work_value_questions.json';
        }

        if (questionsJsonPath) {
          const response = await fetch(questionsJsonPath);
          const loadedQuestions: McqQuestion[] = await response.json();
          
          // Add category property based on the current step if it doesn't exist
          const questionsWithCategory = loadedQuestions.map(q => ({
            ...q,
            category: q.category || `interest-part ${currentStep}`
          }));
          
          setQuestions(questionsWithCategory);
        }

        // Load user responses if logged in
        await loadUserResponses();
      } catch (error) {
        console.error("Failed to load questions:", error);
        setError("Failed to load quiz questions. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestionsAndResponses();
  }, [currentStep]);

  // Load user responses from the database
  const loadUserResponses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return; // Not logged in

      console.log("Loading responses for user:", session.user.id);
      
      const { data, error } = await supabase
        .from('user_responses')
        .select('question_id, response, response_array')
        .eq('user_id', session.user.id);
      
      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        console.log("Loaded", data.length, "responses from database");
        console.log("Sample of loaded responses:", data.slice(0, 3));
        
        const loadedResponses: Record<string | number, string | string[]> = {};
        data.forEach(item => {
          // Handle both string responses and array responses
          if (item.response_array) {
            loadedResponses[item.question_id] = item.response_array as string[];
          } else if (item.response) {
            loadedResponses[item.question_id] = item.response;
          }
        });
        
        setResponses(loadedResponses);
      }
    } catch (error) {
      console.error("Failed to load user responses:", error);
    }
  };

  // Update responses
  const handleResponse = (questionId: string | number, value: string | string[]) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Submit responses to the database
  const submitResponses = async (quizType: string = '') => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("You must be logged in to save your responses");
        return;
      }

      // Determine quiz type from current step if not provided
      const effectiveQuizType = quizType || `interest-part ${currentStep}`;
      
      // Prepare responses for submission
      const responsesToSubmit = [];
      for (const [questionId, response] of Object.entries(responses)) {
        // Skip questions not in the current batch
        const question = questions.find(q => String(q.id) === String(questionId));
        if (!question) continue;

        // Prepare data based on whether it's an array or string
        const isArrayResponse = Array.isArray(response);
        
        responsesToSubmit.push({
          user_id: session.user.id,
          question_id: questionId,
          response: isArrayResponse ? null : String(response),
          response_array: isArrayResponse ? response : null,
          quiz_type: effectiveQuizType,
          component: question.component || question.riasec_component || question.work_value_component || ''
        });
      }

      // Use upsert to handle both new and existing responses
      if (responsesToSubmit.length > 0) {
        const { error: upsertError } = await supabase
          .from('user_responses')
          .upsert(responsesToSubmit, {
            onConflict: 'user_id,question_id',
            ignoreDuplicates: false
          });

        if (upsertError) {
          throw upsertError;
        }
      }

      // Mark quiz segment as completed
      const { error: completionError } = await supabase
        .from('quiz_completion')
        .upsert(
          { 
            user_id: session.user.id, 
            quiz_type: effectiveQuizType,
            completed_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id,quiz_type',
            ignoreDuplicates: false
          }
        );

      if (completionError) {
        throw completionError;
      }

      // Update local storage for offline users
      const existingCompletions = localStorage.getItem('completed_quiz_segments');
      const completions = existingCompletions ? JSON.parse(existingCompletions) : [];
      if (!completions.includes(effectiveQuizType)) {
        completions.push(effectiveQuizType);
        localStorage.setItem('completed_quiz_segments', JSON.stringify(completions));
      }
      
      toast.success("Responses saved successfully!");
    } catch (error) {
      console.error("Failed to submit responses:", error);
      toast.error("Failed to save your responses. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rate module implementation
  const rateModule = async (moduleId: number, rating: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("You must be logged in to rate modules");
        return;
      }

      const { error } = await supabase
        .from('user_feedback')
        .upsert({
          user_id: session.user.id,
          module_id: moduleId,
          rating: rating
        }, {
          onConflict: 'user_id,module_id',
          ignoreDuplicates: false
        });

      if (error) throw error;

      // Update local state
      setUserFeedback(prev => ({
        ...prev,
        [moduleId]: rating
      }));

      toast.success("Module rated successfully!");
    } catch (error) {
      console.error("Failed to rate module:", error);
      toast.error("Failed to save your rating. Please try again.");
    }
  };

  // Refine recommendations implementation
  const refineRecommendations = async (selectedModuleIds: number[] = []) => {
    try {
      setIsLoading(true);
      // Implementation will depend on how recommendations are generated
      // This is a placeholder implementation
      console.log("Refining recommendations with selected modules:", selectedModuleIds);
      
      // In a real implementation, you might call an API or process the data
      // For now, just update the recommendations list with a subset (simulate refinement)
      if (recommendations.length > 0 && selectedModuleIds.length > 0) {
        const refined = recommendations.filter(rec => 
          selectedModuleIds.includes(rec.module_id || rec.module?.id)
        );
        setRecommendations(refined);
      }
      
      toast.success("Recommendations refined!");
    } catch (error) {
      console.error("Failed to refine recommendations:", error);
      toast.error("Failed to refine recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Get final selections implementation
  const getFinalSelections = async (): Promise<Module[]> => {
    try {
      // Implementation will depend on how final selections are determined
      // This is a placeholder implementation
      console.log("Getting final selections");
      
      // In a real implementation, you might call an API or process the data
      // For now, just return the current finalSelections state
      return finalSelections;
    } catch (error) {
      console.error("Failed to get final selections:", error);
      toast.error("Failed to get final selections. Please try again.");
      return [];
    }
  };

  // Reset quiz state
  const resetQuiz = () => {
    setResponses({});
    setCurrentStep(1);
    setRecommendations([]);
    setFinalSelections([]);
  };

  // A navigation function that doesn't rely on useNavigate
  const navigateToPath = (path: string) => {
    window.location.href = path;
  };

  return (
    <QuizContext.Provider
      value={{
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
        debugInfo,
        setCurrentStep,
        handleResponse,
        submitResponses,
        rateModule,
        refineRecommendations,
        getFinalSelections,
        resetQuiz,
        navigateToPath // Add this new method instead of using navigate directly
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};
