
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface QuizCompletedProps {
  onRetake: () => void;
}

export const QuizCompleted = ({ onRetake }: QuizCompletedProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="p-6 bg-green-50 dark:bg-green-900 rounded-lg text-center">
      <h2 className="text-2xl font-bold mb-4">Quiz Completed!</h2>
      <p className="mb-6">Thank you for completing the open-ended questions quiz.</p>
      <Button 
        variant="outline" 
        onClick={() => {
          onRetake();
          navigate('/quiz/open-ended-questions');
        }}
      >
        Retake Quiz
      </Button>
    </div>
  );
};
