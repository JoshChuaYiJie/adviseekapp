
import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { McqQuestion } from '@/utils/quizQuestions';
import { loadQuizQuestions, loadUserResponses } from '../utils/loaderUtils';

export const useQuizState = () => {
  const location = useLocation();
  const params = useParams();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [responses, setResponses] = useState<Record<string | number, string | string[]>>({});
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);

  // Parse currentStep from the URL parameters
  useEffect(() => {
    console.log("Current path:", location.pathname);
    console.log("URL params:", params);
    
    // Check if we're on a quiz page with a step parameter
    if (params.step) {
      const step = parseInt(params.step, 10);
      if (!isNaN(step)) {
        console.log("Setting current step to:", step);
        setCurrentStep(step);
      } else {
        console.log("Invalid step parameter:", params.step);
        setCurrentStep(1); // Default to step 1
      }
    } else if (location.pathname === '/quiz') {
      // Default to step 1 when on the main quiz page
      setCurrentStep(1);
    }
  }, [location.pathname, params]);

  // Load questions from JSON and user responses from DB
  useEffect(() => {
    const loadQuestionsAndResponses = async () => {
      setIsLoading(true);
      try {
        console.log("Loading questions for step:", currentStep);
        
        // Load questions based on current step
        const questionsWithCategory = await loadQuizQuestions(currentStep);
        setQuestions(questionsWithCategory);
        console.log(`Loaded ${questionsWithCategory.length} questions for step ${currentStep}`);

        // Temporarily disable loading user responses when retaking quiz
        // const loadedResponses = await loadUserResponses();
        // setResponses(loadedResponses);
        
        // Use empty responses instead
        setResponses({});
        
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
