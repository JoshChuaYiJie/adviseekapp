
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { McqQuestion } from '@/utils/quizQuestions';

interface QuizContextType {
  currentStep: number;
  responses: Record<string | number, string | string[]>;
  questions: McqQuestion[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  handleResponse: (questionId: string | number, value: string | string[]) => void;
  submitResponses: (quizType?: string) => Promise<void>;
  resetQuiz: () => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error("useQuiz must be used within a QuizProvider");
  }
  return context;
};

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState<number>(1); // Default to step 1
  const [responses, setResponses] = useState<Record<string | number, string | string[]>>({});
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            loadedResponses[item.question_id] = item.response_array;
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
          component: question.component || ''
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

  // Reset quiz state
  const resetQuiz = () => {
    setResponses({});
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
        handleResponse,
        submitResponses,
        resetQuiz
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};
