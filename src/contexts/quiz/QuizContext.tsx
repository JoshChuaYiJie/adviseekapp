
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
    case 'RESET_QUIZ':
      return initialState;
    default:
      return state;
  }
}

const QuizContext = createContext<{
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
  submitResponse: (questionId: string, response: string | string[], quizType?: string) => Promise<void>;
  loadResponses: () => Promise<void>;
  saveResponses: () => Promise<void>;
  calculateResults: (quizType: string) => Promise<void>;
  completeQuiz: (quizType: string) => Promise<void>;
} | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quizReducer, initialState);

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
      console.log('Saving responses for user:', user.id);
      
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
      console.log('Calculating results for quiz type:', quizType);
      
    } catch (error) {
      console.error('Error calculating results:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
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

  return (
    <QuizContext.Provider value={{
      state,
      dispatch,
      submitResponse,
      loadResponses,
      saveResponses,
      calculateResults,
      completeQuiz,
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
