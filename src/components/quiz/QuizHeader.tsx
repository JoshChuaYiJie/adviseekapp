
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Progress } from "@/components/ui/progress";

interface QuizHeaderProps {
  currentStep?: number;
  quizProgress: number;
}

const QuizHeader: React.FC<QuizHeaderProps> = ({ currentStep, quizProgress }) => {
  const { t } = useTranslation();

  return (
    <div className="quiz-header">
      <h1 className="text-3xl font-bold text-center mb-8">{t("quiz.title", "Quiz")}</h1>

      {currentStep !== undefined && (
        <h2 className="text-xl font-semibold text-center mb-4">
          {t(`quiz.section.${currentStep}`, `Section ${currentStep}`)}
        </h2>
      )}

      <Progress value={quizProgress} className="mb-4" />
    </div>
  );
};

export default QuizHeader;
