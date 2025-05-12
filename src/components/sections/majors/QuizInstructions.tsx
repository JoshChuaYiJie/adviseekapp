
import { Button } from '@/components/ui/button';

interface QuizInstructionsProps {
  onStartQuiz: () => void;
}

export const QuizInstructions = ({ onStartQuiz }: QuizInstructionsProps) => {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg mb-4">
        <h3 className="font-medium text-lg mb-2">Open-ended Questions Quiz</h3>
        <p className="text-gray-600 dark:text-gray-300">
          Answer questions about your interests, skills, and experiences related to potential majors.
          These questions are designed to help you reflect on your academic and career goals.
        </p>
      </div>

      <div className="flex justify-center my-8">
        <Button 
          size="lg"
          onClick={onStartQuiz}
          className="px-8 bg-blue-600 hover:bg-blue-700"
        >
          Start Quiz
        </Button>
      </div>
    </div>
  );
};
