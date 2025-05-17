
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { McqQuestion } from '@/utils/quizQuestions';
import { loadQuizQuestions, loadUserResponses } from '../utils/loaderUtils';

export const useQuizState = () => {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [responses, setResponses] = useState<Record<string | number, string | string[]>>({});
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);

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
        const questionsWithCategory = await loadQuizQuestions(currentStep);
        setQuestions(questionsWithCategory);

        // Load user responses if logged in
        const loadedResponses = await loadUserResponses();
        setResponses(loadedResponses);
      } catch (error) {
        console.error("Failed to load questions:", error);
        setError("Failed to load quiz questions. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestionsAndResponses();
  }, [currentStep]);

  // Update responses
  const handleResponse = (questionId: string | number, value: string | string[]) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Reset quiz state
  const resetQuiz = () => {
    setResponses({});
    setCurrentStep(1);
    setError(null);
  };

  return {
    currentStep,
    setCurrentStep,
    responses,
    setResponses,
    questions,
    setQuestions,
    isLoading,
    setIsLoading,
    isSubmitting,
    setIsSubmitting,
    error,
    setError,
    completedQuizzes,
    setCompletedQuizzes,
    handleResponse,
    resetQuiz
  };
};
