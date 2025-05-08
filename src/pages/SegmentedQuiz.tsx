
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { useQuizQuestions, McqQuestion } from "@/utils/quizQuestions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

const QuizQuestion = ({ 
  question, 
  selectedAnswer, 
  onAnswerChange,
  onVisible,
  onIntersect,
  index
}: { 
  question: McqQuestion, 
  selectedAnswer: string | null, 
  onAnswerChange: (answer: string) => void,
  onVisible: () => void,
  onIntersect: (isIntersecting: boolean, index: number) => void,
  index: number
}) => {
  const { isCurrentlyDark } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          onIntersect(entry.isIntersecting, index);
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            onVisible();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [index, onIntersect, onVisible, isVisible]);
  
  return (
    <div 
      ref={ref}
      className={`min-h-[85vh] flex flex-col justify-center p-8 md:p-16 transition-all duration-700
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}`}
      id={`question-${question.id}`}
    >
      <h2 className="text-3xl font-bold mb-4">{question.category}</h2>
      <div className={`max-w-3xl ${isCurrentlyDark ? 'bg-gray-800' : 'bg-white/5'} backdrop-blur-md p-8 rounded-lg border ${isCurrentlyDark ? 'border-gray-700' : 'border-white/10'} shadow-xl`}>
        <h3 className="text-2xl font-semibold mb-6">{question.question}</h3>
        <RadioGroup value={selectedAnswer || ""} onValueChange={onAnswerChange} className="space-y-3 mt-2">
          {question.options.map((option, idx) => (
            <div key={option} className="flex items-center space-x-3">
              <RadioGroupItem id={`${question.id}-${idx}`} value={option} />
              <Label htmlFor={`${question.id}-${idx}`} className="text-lg">
                {option} 
                <span className="ml-2 text-sm text-gray-500">
                  ({question.optionScores?.[option] || idx + 1})
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
  const [visibleCount, setVisibleCount] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const questionsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isCurrentlyDark } = useTheme();
  
  useEffect(() => {
    const handleScroll = () => {
      if (!questionsRef.current) return;
      
      const windowHeight = window.innerHeight;
      const documentHeight = questionsRef.current.scrollHeight;
      const scrolled = window.scrollY;
      
      const progress = Math.min(100, Math.round((scrolled / (documentHeight - windowHeight)) * 100));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    // Update progress based on answered questions
    if (questions.length > 0) {
      const answered = Object.keys(answers).length;
      setProgress((answered / questions.length) * 100);
    }
  }, [answers, questions.length]);

  // Check for user authentication
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
      
      if (session?.user && segmentId) {
        // Load previously saved answers for this segment
        loadPreviousAnswers(session.user.id);
      }
    };
    
    checkUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [segmentId]);
  
  const loadPreviousAnswers = async (userId: string) => {
    if (!segmentId) return;
    
    try {
      // Get user responses for this segment
      const { data, error } = await supabase
        .from('user_responses')
        .select('question_id, response, score')
        .eq('user_id', userId)
        .eq('quiz_type', segmentId);
      
      if (error) {
        console.error('Error loading previous answers:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const savedAnswers: Record<string, string> = {};
        const savedScores: Record<string, number> = {};
        
        data.forEach(item => {
          if (item.response) {
            savedAnswers[item.question_id] = item.response;
          }
          
          if (item.score) {
            savedScores[item.question_id] = item.score;
          }
        });
        
        setAnswers(savedAnswers);
        setScores(savedScores);
        
        toast({
          title: "Previous answers loaded",
          description: "Your previous responses for this quiz have been loaded.",
        });
      }
    } catch (err) {
      console.error("Error loading previous answers:", err);
    }
  };
  
  const handleAnswerChange = (questionId: string, answer: string) => {
    if (!questions) return;
    
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    const score = question.optionScores?.[answer] || 0;
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    setScores(prev => ({
      ...prev,
      [questionId]: score
    }));
  };
  
  const handleQuestionVisible = () => {
    setVisibleCount(prev => prev + 1);
  };

  const handleIntersect = (isIntersecting: boolean, index: number) => {
    if (isIntersecting) {
      setCurrentQuestionIndex(index);
    }
  };
  
  const findFirstUnansweredQuestion = () => {
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!answers[question.id]) {
        const questionElement = document.getElementById(`question-${question.id}`);
        if (questionElement) {
          questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          toast({
            title: "Question required",
            description: "Please answer all questions before submitting.",
            variant: "destructive",
          });
          return false;
        }
      }
    }
    return true;
  };
  
  const handleSubmit = async () => {
    // Check if all questions have answers
    if (!findFirstUnansweredQuestion()) {
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
      
      // If user is logged in, save responses to Supabase as well
      if (userId && segmentId) {
        // Format the data for submission
        const formattedResponses = Object.entries(answers).map(([questionId, response]) => ({
          user_id: userId,
          question_id: parseInt(questionId),
          response: response,
          score: scores[questionId] || 0,
          quiz_type: segmentId
        }));
        
        // Use upsert to handle duplicates gracefully
        const { error } = await supabase
          .from('user_responses')
          .upsert(formattedResponses, {
            onConflict: 'user_id,question_id',
            ignoreDuplicates: false
          });
          
        if (error) {
          console.error("Error saving responses to Supabase:", error);
          toast({
            title: "Warning",
            description: "Your answers were saved locally, but we couldn't sync them to your account.",
            variant: "destructive"
          });
        } else {
          // Also save the completion status
          await supabase
            .from('quiz_completion')
            .upsert({
              user_id: userId,
              quiz_type: segmentId,
              completed_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,quiz_type',
              ignoreDuplicates: false
            });
        }
      } else if (!userId) {
        toast({
          title: "Not logged in",
          description: "Your answers are saved locally. Login to sync across devices.",
          variant: "default"
        });
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
  
  return (
    <div className={`min-h-screen ${isCurrentlyDark ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-[#f8fafc] via-[#ede9fe] to-[#f3e8ff]'}`}>
      <div className="container mx-auto">
        <div className="sticky top-0 z-50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border-b border-purple-100 dark:border-gray-700 p-4 shadow-sm">
          <div className="mb-2 flex justify-between items-center">
            <h1 className="text-2xl font-extrabold text-purple-700 dark:text-purple-400 font-sans drop-shadow-sm">
              {segmentId.charAt(0).toUpperCase() + segmentId.slice(1).replace("-", " ")} Quiz
            </h1>
            <span className="text-lg font-medium text-purple-400">
              {progress.toFixed(0)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-purple-100 dark:bg-purple-900" />
        </div>
        
        <div ref={questionsRef} className="pb-24">
          {questions.map((question, index) => (
            <QuizQuestion 
              key={question.id}
              question={question}
              selectedAnswer={answers[question.id] || null}
              onAnswerChange={(answer) => handleAnswerChange(question.id, answer)}
              onVisible={handleQuestionVisible}
              onIntersect={handleIntersect}
              index={index}
            />
          ))}
        </div>
        
        <div className="fixed bottom-8 flex justify-center w-full z-40">
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || Object.keys(answers).length !== questions.length}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white py-6 px-12 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 font-bold"
          >
            {submitting ? (
              <>
                <span className="animate-spin mr-2">↻</span> Submitting...
              </>
            ) : (
              'Submit Answers'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SegmentedQuiz;
