
import React, { createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { QuizContextType } from './types';
import { useQuizState } from './hooks/useQuizState';
import { useModuleManagement } from './hooks/useModuleManagement';
import { submitResponses } from './utils/submissionUtils';

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
  // Use our custom hooks for state management
  const quizState = useQuizState();
  const moduleManagement = useModuleManagement();
  
  const {
    currentStep,
    setCurrentStep,
    responses,
    questions,
    isLoading,
    isSubmitting,
    setIsSubmitting,
    error,
    completedQuizzes,
    handleResponse,
    resetQuiz
  } = quizState;
  
  const {
    recommendations,
    userFeedback,
    modules,
    finalSelections,
    debugInfo,
    rateModule,
    refineRecommendations,
    getFinalSelections
  } = moduleManagement;

  // Submit responses to the database
  const handleSubmitResponses = async (quizType: string = ''): Promise<void> => {
    setIsSubmitting(true);
    try {
      // Determine quiz type from current step if not provided
      const effectiveQuizType = quizType || `interest-part ${currentStep}`;
      
      await submitResponses({
        responses,
        questions,
        quizType: effectiveQuizType
      });
      
    } catch (error) {
      console.error("Error submitting responses:", error);
    } finally {
      setIsSubmitting(false);
    }
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
        submitResponses: handleSubmitResponses,
        rateModule,
        refineRecommendations,
        getFinalSelections,
        resetQuiz,
        navigateToPath
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};
