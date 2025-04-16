
import { useState } from 'react';
import { useQuiz } from '@/contexts/QuizContext';
import { DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import { QuizForm } from './QuizForm';
import { RecommendationsDisplay } from './RecommendationsDisplay';

interface CourseQuizContainerProps {
  onClose: () => void;
}

export const CourseQuizContainer: React.FC<CourseQuizContainerProps> = ({ onClose }) => {
  const { isLoading, error, recommendations } = useQuiz();
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  
  const handleFormSubmit = () => {
    setQuizSubmitted(true);
  };
  
  const handleReset = () => {
    setQuizSubmitted(false);
  };
  
  return (
    <div className="max-h-[85vh] overflow-y-auto">
      {!quizSubmitted ? (
        <>
          <DialogHeader className="px-6 pt-6 pb-2 border-b">
            <DialogTitle className="text-2xl font-bold text-center text-[#1E90FF]">Course Selection Quiz</DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Answer these questions to help us recommend the best courses for you
            </DialogDescription>
          </DialogHeader>
          
          <QuizForm onSubmit={handleFormSubmit} onCancel={onClose} />
        </>
      ) : (
        <RecommendationsDisplay onBack={handleReset} onReset={onClose} />
      )}
    </div>
  );
};
