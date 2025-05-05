import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { useQuizQuestions, McqQuestion } from "@/utils/quizQuestions";

const QuizQuestion = ({ 
  question, 
  selectedAnswer, 
  onAnswerChange 
}: { 
  question: McqQuestion, 
  selectedAnswer: string | null, 
  onAnswerChange: (answer: string) => void 
}) => {
  const { isCurrentlyDark } = useTheme();
  
  return (
    <div className={`min-h-[60vh] flex flex-col justify-center p-8 md:p-16`}>
      <h2 className="text-3xl font-bold mb-4">{question.category}</h2>
      <div className={`max-w-3xl ${isCurrentlyDark ? 'bg-gray-800' : 'bg-white/5'} backdrop-blur-md p-8 rounded-lg border ${isCurrentlyDark ? 'border-gray-700' : 'border-white/10'} shadow-xl`}>
        <h3 className="text-2xl font-semibold mb-6">{question.question}</h3>
        <RadioGroup value={selectedAnswer || ""} onValueChange={onAnswerChange} className="space-y-3 mt-2">
          {question.options.map((option, index) => (
            <div key={option} className="flex items-center space-x-3">
              <RadioGroupItem id={`${question.id}-${index}`} value={option} />
              <Label htmlFor={`${question.id}-${index}`} className="text-lg">
                {option} 
                <span className="ml-2 text-sm text-gray-500">
                  ({question.optionScores?.[option] || index + 1})
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
};

const SegmentedQuiz = () => {
  const { segmentId } = useParams<{ segmentId: string }>();
  const { questions, loading, error } = useQuizQuestions(segmentId || '');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isCurrentlyDark } = useTheme();
  
  useEffect(() => {
    // Update progress whenever current question changes
    if (questions.length > 0) {
      setProgress(((currentQuestionIndex + 1) / questions.length) * 100);
    }
  }, [currentQuestionIndex, questions.length]);
  
  const handleAnswerChange = (answer: string) => {
    if (!questions[currentQuestionIndex]) return;
    
    const questionId = questions[currentQuestionIndex].id;
    const score = questions[currentQuestionIndex].optionScores?.[answer] || 0;
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    setScores(prev => ({
      ...prev,
      [questionId]: score
    }));
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleSubmit = async () => {
    // Check if all questions have answers
    const unansweredQuestions = questions.filter(q => !answers[q.id]);
    
    if (unansweredQuestions.length > 0) {
      toast({
        title: "Incomplete Answers",
        description: `Please answer all questions before submitting.`,
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Save answers and scores to localStorage
      localStorage.setItem(`quiz_answers_${segmentId}`, JSON.stringify(answers));
      localStorage.setItem(`quiz_scores_${segmentId}`, JSON.stringify(scores));
      
      // Calculate and store the total score for this segment
      const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
      localStorage.setItem(`quiz_total_score_${segmentId}`, totalScore.toString());
      
      // Mark this segment as completed
      const completedSegments = JSON.parse(localStorage.getItem("completed_quiz_segments") || "[]");
      if (!completedSegments.includes(segmentId)) {
        completedSegments.push(segmentId);
        localStorage.setItem("completed_quiz_segments", JSON.stringify(completedSegments));
      }
      
      toast({
        title: "Quiz Completed",
        description: `You've completed the ${segmentId} quiz section!`,
      });
      
      // Redirect to dashboard
      navigate("/?section=about-me");
    } catch (error) {
      console.error("Error saving quiz answers:", error);
      toast({
        title: "Error",
        description: "Failed to save your answers. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="animate-spin w-12 h-12 border-t-2 border-purple-500 border-r-2 rounded-full mb-4"></div>
        <h2 className="text-2xl font-semibold">Loading questions...</h2>
      </div>
    );
  }
  
  if (error || !segmentId || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
        <p className="mb-8">{error || "Invalid quiz segment or no questions available."}</p>
        <Button onClick={() => navigate("/?section=about-me")}>Return to Dashboard</Button>
      </div>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = answers[currentQuestion?.id] || null;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  
  return (
    <div className={`min-h-screen ${isCurrentlyDark ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-[#f8fafc] via-[#ede9fe] to-[#f3e8ff]'}`}>
      <div className="container mx-auto">
        <div className="sticky top-0 z-50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border-b border-purple-100 dark:border-gray-700 p-4 shadow-sm">
          <div className="mb-2 flex justify-between items-center">
            <h1 className="text-2xl font-extrabold text-purple-700 dark:text-purple-400 font-sans drop-shadow-sm">
              {segmentId.charAt(0).toUpperCase() + segmentId.slice(1).replace("-", " ")} Quiz
            </h1>
            <span className="text-lg font-medium text-purple-400">
              {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-purple-100 dark:bg-purple-900" />
        </div>
        
        <div className="py-4">
          <QuizQuestion 
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            onAnswerChange={handleAnswerChange}
          />
        </div>
        
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-700">
          <div className="container mx-auto flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={handlePrevious} 
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            
            {isLastQuestion ? (
              <Button 
                onClick={handleSubmit} 
                disabled={submitting || !selectedAnswer}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin mr-2">↻</span> Submitting...
                  </>
                ) : (
                  'Submit Answers'
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleNext} 
                disabled={!selectedAnswer}
              >
                Next Question
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SegmentedQuiz;
