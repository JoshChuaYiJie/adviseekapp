
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";

interface QuizNavigationProps {
  currentStep: number;
  isLastStep: boolean;
  isSubmitting: boolean;
  goToPreviousStep: () => void;
  handleNext: () => void;
  resetQuiz: () => void;
  toggleDebugger: () => void;
  showDebugger: boolean;
}

const QuizNavigation: React.FC<QuizNavigationProps> = ({
  currentStep,
  isLastStep,
  isSubmitting,
  goToPreviousStep,
  handleNext,
  resetQuiz,
  toggleDebugger,
  showDebugger
}) => {
  const { t } = useTranslation();

  return (
    <div className="quiz-navigation">
      <div className="flex justify-between">
        <Button variant="outline" onClick={goToPreviousStep} disabled={currentStep === 1}>
          {t("quiz.previous", "Previous")}
        </Button>
        <Button onClick={handleNext} disabled={isSubmitting}>
          {isLastStep ? t("quiz.complete", "Complete") : t("quiz.next", "Next")}
        </Button>
      </div>

      <div className="flex justify-center mt-4">
        <Button variant="secondary" onClick={resetQuiz}>
          {t("quiz.reset", "Reset Quiz")}
        </Button>
      </div>

      <div className="flex justify-center mt-4">
        <Button variant="ghost" onClick={toggleDebugger}>
          {showDebugger ? "Hide Debugger" : "Show Debugger"}
        </Button>
      </div>
    </div>
  );
};

export default QuizNavigation;
