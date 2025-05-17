
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuiz } from "@/contexts/QuizContext";
import { supabase } from "@/integrations/supabase/client";

// Import our new components
import QuizHeader from "@/components/quiz/QuizHeader";
import QuizQuestionRenderer from "@/components/quiz/QuizQuestionRenderer";
import QuizNavigation from "@/components/quiz/QuizNavigation";
import QuizDebugger from "@/components/quiz/QuizDebugger";

const SegmentedQuiz = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isCurrentlyDark } = useTheme();
  const {
    currentStep,
    responses,
    questions,
    isLoading,
    isSubmitting,
    error,
    handleResponse,
    submitResponses,
    resetQuiz
  } = useQuiz();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDebugger, setShowDebugger] = useState(false);
  const [quizProgress, setQuizProgress] = useState(0);
  const [isLastStep, setIsLastStep] = useState(false);

  // Fetch user ID
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
      } catch (error) {
        console.error("Error fetching user ID:", error);
        toast({
          title: "Error",
          description: "Failed to retrieve user information.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserId();
  }, [toast]);

  // Update progress based on current step
  useEffect(() => {
    if (currentStep) {
      // Map step to progress percentage
      const stepToProgress: Record<number, number> = {
        1: 25,
        2: 50,
        3: 75,
        4: 100
      };
      setQuizProgress(stepToProgress[currentStep] || 0);
      
      // Set if this is the last step
      setIsLastStep(currentStep === 4); // Assuming 4 is the last step
    }
  }, [currentStep]);

  // Handle answer changes
  const handleAnswerChange = useCallback((questionId: string | number, value: string | string[] | null) => {
    handleResponse(questionId, value as string | string[]);
  }, [handleResponse]);

  // Navigation functions
  const goToNextStep = () => {
    if (currentStep < 4) {
      navigate(`/quiz/interest-part/${currentStep + 1}`);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      navigate(`/quiz/interest-part/${currentStep - 1}`);
    }
  };

  const handleQuizCompletion = async () => {
    const quizType = `interest-part ${currentStep}`;
    await submitResponses(quizType);
    navigate('/recommendations');
  };

  const handleNext = async () => {
    if (isLastStep) {
      await handleQuizCompletion();
    } else {
      goToNextStep();
    }
  };

  const toggleDebugger = () => {
    setShowDebugger(!showDebugger);
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto py-10">
        <QuizHeader 
          currentStep={currentStep} 
          quizProgress={quizProgress} 
        />

        <QuizQuestionRenderer
          currentStep={currentStep}
          questions={questions}
          responses={responses}
          handleAnswerChange={handleAnswerChange}
          loading={loading}
          isLoading={isLoading}
        />

        <QuizNavigation
          currentStep={currentStep || 1}
          isLastStep={isLastStep}
          isSubmitting={isSubmitting}
          goToPreviousStep={goToPreviousStep}
          handleNext={handleNext}
          resetQuiz={resetQuiz}
          toggleDebugger={toggleDebugger}
          showDebugger={showDebugger}
        />

        {showDebugger && (
          <QuizDebugger
            userId={userId || ""}
            responses={responses}
            quizType={String(currentStep) || ""}
            debugData={{
              questions,
              currentStep,
              responses: String(JSON.stringify(responses)),
              quizProgress,
            }}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default SegmentedQuiz;
