
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Question, QuizState, QuizAction, QuizResponse } from './types';

const initialState: QuizState = {
  responses: {},
  completedQuizzes: new Set(),
  currentQuiz: null,
  questions: {},
  results: {},
  loading: false,
  error: null,
  currentStep: 1,
  isSubmitting: false,
  userFeedback: {},
  debugInfo: null,
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_RESPONSE':
      return {
        ...state,
        responses: {
          ...state.responses,
          [action.payload.questionId]: action.payload.response,
        },
      };
    case 'SET_RESPONSES':
      return { ...state, responses: action.payload };
    case 'SET_QUESTIONS':
      return {
        ...state,
        questions: {
          ...state.questions,
          [action.payload.quizType]: action.payload.questions,
        },
      };
    case 'COMPLETE_QUIZ':
      return {
        ...state,
        completedQuizzes: new Set([...state.completedQuizzes, action.payload]),
      };
    case 'SET_CURRENT_QUIZ':
      return { ...state, currentQuiz: action.payload };
    case 'SET_RESULTS':
      return {
        ...state,
        results: {
          ...state.results,
          [action.payload.quizType]: action.payload.results,
        },
      };
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    case 'SET_USER_FEEDBACK':
      return { ...state, userFeedback: action.payload };
    case 'SET_DEBUG_INFO':
      return { ...state, debugInfo: action.payload };
    case 'RESET_QUIZ':
      return initialState;
    default:
      return state;
  }
}

const QuizContext = createContext<{
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
  // Expose state properties directly for compatibility
  isLoading: boolean;
  error: string | null;
  recommendations: any[];
  currentStep: number;
  questions: Question[];
  isSubmitting: boolean;
  responses: Record<string, string>;
  debugInfo: any;
  userFeedback: Record<number, number>;
  // Methods
  setCurrentStep: (step: number) => void;
  submitResponse: (questionId: string, response: string | string[], quizType?: string) => Promise<void>;
  loadResponses: () => Promise<void>;
  saveResponses: () => Promise<void>;
  calculateResults: (quizType: string) => Promise<void>;
  completeQuiz: (quizType: string) => Promise<void>;
  submitResponses: (quizType?: string) => Promise<void>;
  handleResponse: (questionId: string, response: string | string[]) => void;
  rateModule: (moduleId: number, rating: number) => Promise<void>;
  getFinalSelections: () => Promise<any[]>;
} | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  // Load sample questions for testing
  useEffect(() => {
    const sampleQuestions: Question[] = [
      {
        id: 'q1',
        question_text: 'What is your preferred learning style?',
        question_type: 'single-select',
        options: ['Visual', 'Auditory', 'Kinesthetic', 'Reading/Writing'],
        section: 'Learning Preferences'
      },
      {
        id: 'q2',
        question_text: 'Which subjects interest you most?',
        question_type: 'multi-select',
        options: ['Mathematics', 'Science', 'Literature', 'History', 'Arts'],
        section: 'Academic Interests'
      }
    ];

    dispatch({
      type: 'SET_QUESTIONS',
      payload: { quizType: 'general', questions: sampleQuestions }
    });
  }, []);

  const setCurrentStep = (step: number) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: step });
  };

  const handleResponse = (questionId: string, response: string | string[]) => {
    const responseValue = Array.isArray(response) ? response.join(',') : response;
    dispatch({
      type: 'SET_RESPONSE',
      payload: { questionId, response: responseValue },
    });
  };

  const submitResponse = async (questionId: string, response: string | string[], quizType?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const responseValue = Array.isArray(response) ? response.join(',') : response;
      
      const { error } = await supabase
        .from('user_responses')
        .upsert({
          user_id: user.id,
          question_id: questionId,
          response: responseValue,
          quiz_type: quizType || 'unknown',
          response_array: Array.isArray(response) ? response : null,
        }, {
          onConflict: 'user_id,question_id'
        });

      if (error) throw error;

      dispatch({
        type: 'SET_RESPONSE',
        payload: { questionId, response: responseValue },
      });
    } catch (error) {
      console.error('Error submitting response:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const submitResponses = async (quizType?: string) => {
    try {
      dispatch({ type: 'SET_SUBMITTING', payload: true });
      
      // Process all responses
      const responseEntries = Object.entries(state.responses);
      for (const [questionId, response] of responseEntries) {
        await submitResponse(questionId, response, quizType);
      }
      
      
    } catch (error) {
      console.error('Error submitting responses:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  };

  const loadResponses = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_responses')
        .select('question_id, response')
        .eq('user_id', user.id);

      if (error) throw error;

      const responses = data?.reduce((acc, curr) => {
        acc[curr.question_id] = curr.response;
        return acc;
      }, {} as Record<string, string>) || {};

      dispatch({ type: 'SET_RESPONSES', payload: responses });
    } catch (error) {
      console.error('Error loading responses:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const saveResponses = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Temporarily disabled - implement when needed
      
      
    } catch (error) {
      console.error('Error saving responses:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const calculateResults = async (quizType: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Implementation would depend on quiz type and scoring logic
      
      
    } catch (error) {
      console.error('Error calculating results:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const rateModule = async (moduleId: number, rating: number) => {
    try {
      const newFeedback = { ...state.userFeedback, [moduleId]: rating };
      dispatch({ type: 'SET_USER_FEEDBACK', payload: newFeedback });
      
    } catch (error) {
      console.error('Error rating module:', error);
    }
  };

  const getFinalSelections = async () => {
    try {
      // Mock implementation - return empty array for now
      
      return [];
    } catch (error) {
      console.error('Error getting final selections:', error);
      return [];
    }
  };

  const completeQuiz = async (quizType: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('quiz_completion')
        .insert({
          user_id: user.id,
          quiz_type: quizType,
        });

      if (error) throw error;

      dispatch({ type: 'COMPLETE_QUIZ', payload: quizType });
    } catch (error) {
      console.error('Error completing quiz:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  useEffect(() => {
    loadResponses();
  }, []);

  // Get current questions array
  const currentQuestions = state.currentQuiz ? state.questions[state.currentQuiz] || [] : state.questions['general'] || [];

  return (
    <QuizContext.Provider value={{
      state,
      dispatch,
      // Expose state properties directly
      isLoading: state.loading,
      error: state.error,
      recommendations: [], // Mock empty array
      currentStep: state.currentStep,
      questions: currentQuestions,
      isSubmitting: state.isSubmitting,
      responses: state.responses,
      debugInfo: state.debugInfo,
      userFeedback: state.userFeedback,
      // Methods
      setCurrentStep,
      submitResponse,
      loadResponses,
      saveResponses,
      calculateResults,
      completeQuiz,
      submitResponses,
      handleResponse,
      rateModule,
      getFinalSelections,
    }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
}
