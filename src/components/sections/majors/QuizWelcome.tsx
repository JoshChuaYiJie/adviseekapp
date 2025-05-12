
import { Button } from '@/components/ui/button';
import { useTheme } from "@/contexts/ThemeContext";

interface QuizWelcomeProps {
  onStartQuiz: () => void;
}

export const QuizWelcome = ({ onStartQuiz }: QuizWelcomeProps) => {
  const { isCurrentlyDark } = useTheme();
  
  return (
    <div className={`p-6 ${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow`}>
      <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
        <h2 className="text-2xl font-medium">Open-ended Questions</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg">
          Answer questions specific to your interests, skills, and experiences related to potential fields of study.
        </p>
        <Button 
          size="lg" 
          onClick={onStartQuiz}
          className="px-8"
        >
          Take Quiz
        </Button>
      </div>
    </div>
  );
};
