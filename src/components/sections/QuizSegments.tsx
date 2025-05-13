
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuiz } from "@/contexts/QuizContext";
import { 
  Dialog, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { RecommendationDisclaimer } from "@/components/RecommendationDisclaimer";

interface QuizSegment {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  bgColor: string;
}

export const QuizSegments = () => {
  const navigate = useNavigate();
  const { completedQuizzes } = useQuiz();
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  // Parse completed segments from local storage for backward compatibility
  const localCompletedSegments = JSON.parse(localStorage.getItem("completed_quiz_segments") || "[]");
  
  // Combine both sources
  const allCompletedQuizzes = [...new Set([...(completedQuizzes || []), ...localCompletedSegments])];

  const handleExploreClick = (segmentId: string) => {
    navigate(`/quiz/${segmentId}`);
  };
  
  const handleIdealProgrammeClick = () => {
    // Show the disclaimer dialog instead of navigating directly
    setDisclaimerOpen(true);
  };

  const segments: QuizSegment[] = [
    {
      id: "interest-part 1",
      title: "Discover Your Interests",
      description: "Part 1: Interests quiz to help you discover what you enjoy.",
      icon: <span className="text-2xl">🔍</span>,
      bgColor: "bg-blue-50 dark:bg-blue-900"
    },
    {
      id: "interest-part 2",
      title: "Exploring Interests",
      description: "Part 2: Dive deeper into your personal interests.",
      icon: <span className="text-2xl">🧩</span>,
      bgColor: "bg-green-50 dark:bg-green-900"
    },
    {
      id: "competence",
      title: "Your Skills",
      description: "Rate your skills and competencies in different areas.",
      icon: <span className="text-2xl">⭐</span>,
      bgColor: "bg-yellow-50 dark:bg-yellow-900"
    },
    {
      id: "work-values",
      title: "Work Values",
      description: "Identify what matters most to you in a career.",
      icon: <span className="text-2xl">💼</span>,
      bgColor: "bg-purple-50 dark:bg-purple-900"
    },
  ];

  const isAllQuizzesCompleted = segments.every(segment => 
    allCompletedQuizzes.includes(segment.id)
  );

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Personality Quizzes</h2>
        <p className="text-gray-600 dark:text-gray-400">Complete all quizzes to receive your university programme recommendations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {segments.map((segment) => {
          const isCompleted = allCompletedQuizzes.includes(segment.id);
          return (
            <div 
              key={segment.id} 
              className={`rounded-lg p-5 shadow-md transition-all hover:shadow-lg ${segment.bgColor} ${
                isCompleted ? "border-2 border-green-400 dark:border-green-600" : ""
              }`}
            >
              <div className="flex items-start mb-3">
                <div className="mr-3 bg-white dark:bg-gray-800 h-10 w-10 rounded-full flex items-center justify-center shadow-sm">
                  {segment.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{segment.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{segment.description}</p>
                </div>
              </div>
              <div className="mt-3">
                <Button 
                  variant={isCompleted ? "outline" : "default"}
                  className={`w-full ${isCompleted ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" : ""}`}
                  onClick={() => handleExploreClick(segment.id)}
                >
                  {isCompleted ? "Review Quiz" : "Start Quiz"}
                </Button>
              </div>
              {isCompleted && (
                <div className="flex items-center mt-2 text-green-600 dark:text-green-400 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Completed
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <div className={`p-6 rounded-lg ${isAllQuizzesCompleted ? "bg-gradient-to-r from-purple-400 to-indigo-500" : "bg-gray-100 dark:bg-gray-800"}`}>
          <h3 className={`text-xl font-bold mb-2 ${isAllQuizzesCompleted ? "text-white" : "text-gray-700 dark:text-gray-300"}`}>
            {isAllQuizzesCompleted 
              ? "Great job! You've completed all quizzes" 
              : "Complete all quizzes to unlock your recommendation"
            }
          </h3>
          <p className={`mb-4 ${isAllQuizzesCompleted ? "text-white text-opacity-80" : "text-gray-500 dark:text-gray-400"}`}>
            {isAllQuizzesCompleted 
              ? "We can now recommend the perfect university programme for you" 
              : "Your responses help us understand your interests and values"
            }
          </p>

          <Dialog open={disclaimerOpen} onOpenChange={setDisclaimerOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg"
                disabled={!isAllQuizzesCompleted}
                className={`px-8 py-2 ${
                  isAllQuizzesCompleted 
                    ? "bg-white text-indigo-600 hover:bg-gray-100" 
                    : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                }`}
                onClick={isAllQuizzesCompleted ? handleIdealProgrammeClick : undefined}
              >
                {isAllQuizzesCompleted ? "What is my ideal programme?" : "Complete all quizzes first"}
              </Button>
            </DialogTrigger>
            <RecommendationDisclaimer onClose={() => setDisclaimerOpen(false)} />
          </Dialog>
        </div>
      </div>
    </div>
  );
};
