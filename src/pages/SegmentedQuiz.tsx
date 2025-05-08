
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
import { 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Bug
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

// Import debugging helper
import { validateUserResponsesTable, testInsertResponse } from "@/contexts/quiz/utils/databaseHelpers";

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
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [debugLog, setDebugLog] = useState<Array<{timestamp: Date, message: string, data?: any}>>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const questionsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isCurrentlyDark } = useTheme();
  
  // Add a debug log entry
  const addDebugLog = (message: string, data?: any) => {
    const entry = { 
      timestamp: new Date(), 
      message, 
      data 
    };
    console.log(`DEBUG: ${message}`, data);
    setDebugLog(prev => [...prev, entry]);
  };
  
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
      try {
        setAuthStatus('checking');
        addDebugLog("Checking user authentication status");
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          addDebugLog("Error getting session", sessionError);
          setAuthStatus('unauthenticated');
          return;
        }
        
        if (session?.user) {
          setUserId(session.user.id);
          setAuthStatus('authenticated');
          addDebugLog("User is authenticated", { 
            userId: session.user.id, 
            email: session.user.email 
          });
          
          if (segmentId) {
            // Load previously saved answers for this segment
            loadPreviousAnswers(session.user.id);
          }
        } else {
          setUserId(null);
          setAuthStatus('unauthenticated');
          addDebugLog("No active session found");
        }
      } catch (err) {
        addDebugLog("Exception in checkUser", err);
        setAuthStatus('unauthenticated');
      }
    };
    
    checkUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addDebugLog("Auth state changed", { event, userId: session?.user?.id });
      setUserId(session?.user?.id || null);
      setAuthStatus(session?.user ? 'authenticated' : 'unauthenticated');
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [segmentId]);
  
  // Validate DB setup
  useEffect(() => {
    const validateDb = async () => {
      if (authStatus === 'authenticated') {
        try {
          addDebugLog("Validating database configuration");
          const results = await validateUserResponsesTable();
          setValidationResults(results);
          addDebugLog("Database validation results", results);
          
          if (!results.success) {
            toast({
              title: "Database Configuration Warning",
              description: "There might be issues with the database setup that could affect saving your responses.",
              variant: "warning"
            });
          }
        } catch (err) {
          addDebugLog("Error during database validation", err);
        }
      }
    };
    
    validateDb();
  }, [authStatus, toast]);
  
  const loadPreviousAnswers = async (userId: string) => {
    if (!segmentId) return;
    
    try {
      addDebugLog("Loading previous answers", { userId, segmentId });
      
      // Get user responses for this segment
      const { data, error } = await supabase
        .from('user_responses')
        .select('question_id, response, score')
        .eq('user_id', userId)
        .eq('quiz_type', segmentId);
      
      if (error) {
        addDebugLog("Error loading previous answers", error);
        toast({
          title: "Error",
          description: `Failed to load previous answers: ${error.message}`,
          variant: "destructive"
        });
        return;
      }
      
      if (data && data.length > 0) {
        addDebugLog(`Found ${data.length} previous responses`, data.slice(0, 2));
        
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
      } else {
        addDebugLog("No previous answers found");
      }
    } catch (err) {
      addDebugLog("Exception in loadPreviousAnswers", err);
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
    
    addDebugLog("Answer changed", { 
      questionId, 
      answer, 
      score,
      totalAnswered: Object.keys({...answers, [questionId]: answer}).length,
      totalQuestions: questions.length
    });
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
  
  const testInsert = async () => {
    try {
      addDebugLog("Running manual insert test");
      const result = await testInsertResponse();
      addDebugLog("Test insert result", result);
      
      toast({
        title: result.success ? "Test successful" : "Test failed",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (err) {
      addDebugLog("Exception in testInsert", err);
      toast({
        title: "Test error",
        description: String(err),
        variant: "destructive"
      });
    }
  };
  
  const handleSubmit = async () => {
    // Check if all questions have answers
    if (!findFirstUnansweredQuestion()) {
      return;
    }
    
    setSubmitting(true);
    setSubmissionError(null);
    
    try {
      // Save answers and scores to localStorage for backup
      localStorage.setItem(`quiz_answers_${segmentId}`, JSON.stringify(answers));
      localStorage.setItem(`quiz_scores_${segmentId}`, JSON.stringify(scores));
      
      // Calculate and store the total score for this segment
      const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
      localStorage.setItem(`quiz_total_score_${segmentId}`, totalScore.toString());
      
      // Mark this segment as completed in localStorage
      const completedSegments = JSON.parse(localStorage.getItem("completed_quiz_segments") || "[]");
      if (!completedSegments.includes(segmentId)) {
        completedSegments.push(segmentId);
        localStorage.setItem("completed_quiz_segments", JSON.stringify(completedSegments));
      }
      
      addDebugLog("Local data saved", { 
        answers: Object.keys(answers).length,
        scores: Object.keys(scores).length,
        totalScore,
        completedSegments
      });
      
      // If user is logged in, save responses to Supabase as well
      if (userId && segmentId) {
        // Get the current authentication status before saving
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          addDebugLog("Session lost before saving to Supabase");
          setSubmissionError("Your authentication session expired. Please login again to save your answers to your account.");
          throw new Error("Authentication session expired");
        }
        
        addDebugLog("Verified authentication before saving", { 
          userId: session.user.id,
          segmentId 
        });
        
        // Format the data for submission
        const formattedResponses = Object.entries(answers).map(([questionId, response]) => ({
          user_id: userId,
          question_id: parseInt(questionId),
          response: response,
          score: scores[questionId] || 0,
          quiz_type: segmentId
        }));
        
        addDebugLog(`Saving ${formattedResponses.length} responses to Supabase`, 
          formattedResponses.length > 0 ? formattedResponses[0] : null
        );
        
        // Use upsert to handle duplicates gracefully
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        for (let i = 0; i < formattedResponses.length; i++) {
          const response = formattedResponses[i];
          
          addDebugLog(`Saving response ${i+1}/${formattedResponses.length}`, {
            question_id: response.question_id,
            response_length: response.response ? response.response.length : 0,
            score: response.score
          });
          
          const { data, error } = await supabase
            .from('user_responses')
            .upsert(response, {
              onConflict: 'user_id,question_id',
              ignoreDuplicates: false
            })
            .select();
              
          if (error) {
            addDebugLog(`Error saving response ${i+1}/${formattedResponses.length}`, {
              error: {
                code: error.code,
                message: error.message,
                details: error.details
              }
            });
            errorCount++;
            errors.push(error);
          } else {
            successCount++;
          }
        }
        
        addDebugLog("Save results", { successCount, errorCount });

        if (errorCount > 0) {
          const firstError = errors[0];
          toast({
            title: "Warning",
            description: `Saved ${successCount} of ${formattedResponses.length} answers. Some errors occurred.`,
            variant: "warning"
          });
          
          if (successCount === 0) {
            // All saves failed
            setSubmissionError(`Failed to save responses: ${firstError.message}`);
            throw new Error(`Failed to save responses: ${firstError.message}`);
          }
        }

        // Also save the completion status
        addDebugLog("Saving quiz completion status", { userId, segmentId });
        
        const { error: completionError } = await supabase
          .from('quiz_completion')
          .upsert({
            user_id: userId,
            quiz_type: segmentId,
            completed_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,quiz_type',
            ignoreDuplicates: false
          });
            
        if (completionError) {
          addDebugLog("Error saving quiz completion", completionError);
        } else {
          addDebugLog("Quiz completion status saved successfully");
        }
      } else if (!userId) {
        addDebugLog("Not logged in, only saved locally");
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      addDebugLog("Error saving quiz answers", error);
      
      if (!submissionError) {
        setSubmissionError(errorMessage);
      }
      
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
          
          {/* Authentication status indicator */}
          <div className="mt-2">
            {authStatus === 'checking' ? (
              <div className="flex items-center text-xs text-amber-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                <span>Checking authentication...</span>
              </div>
            ) : authStatus === 'authenticated' ? (
              <div className="flex items-center text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                <span>Logged in as {userId?.substring(0, 8)}...</span>
              </div>
            ) : (
              <div className="flex items-center text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                <span>Not logged in - responses only saved locally</span>
              </div>
            )}
          </div>
        </div>
        
        {submissionError && (
          <Alert className="mt-4 mx-4 bg-red-50 dark:bg-red-900/20 border-red-200">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertTitle>Error saving responses</AlertTitle>
            <AlertDescription>
              {submissionError}
            </AlertDescription>
          </Alert>
        )}
        
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
        
        <div className="fixed bottom-8 flex flex-col items-center w-full z-40">
          {/* Debug controls (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 flex space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowDebug(!showDebug)}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-xs"
              >
                <Bug className="h-3 w-3 mr-1" />
                {showDebug ? 'Hide Debug' : 'Show Debug'}
              </Button>
              
              {authStatus === 'authenticated' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={testInsert}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-xs"
                >
                  <Bug className="h-3 w-3 mr-1" />
                  Test Insert
                </Button>
              )}
            </div>
          )}
          
          {/* Debug info panel */}
          {showDebug && (
            <Card className="w-11/12 max-w-3xl mb-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md text-xs overflow-hidden shadow-lg">
              <ScrollArea className="h-60">
                <div className="p-3">
                  <h3 className="font-bold mb-2">Debug Information</h3>
                  
                  <div className="mb-3">
                    <h4 className="font-semibold">Authentication</h4>
                    <div className="pl-2">
                      <p>Status: {authStatus}</p>
                      <p>User ID: {userId || 'None'}</p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <h4 className="font-semibold">Quiz Data</h4>
                    <div className="pl-2">
                      <p>Quiz Type: {segmentId}</p>
                      <p>Questions: {questions.length}</p>
                      <p>Answered: {Object.keys(answers).length}</p>
                      <p>Progress: {progress.toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  {validationResults && (
                    <div className="mb-3">
                      <h4 className="font-semibold">Database Validation</h4>
                      <div className="pl-2">
                        <p>RLS Enabled: {validationResults.hasRlsEnabled ? '✅' : '❌'}</p>
                        <p>Unique Constraint: {validationResults.hasUniqueConstraint ? '✅' : '❌'}</p>
                        <p>Correct Policy: {validationResults.hasCorrectPolicy ? '✅' : '❌'}</p>
                        <p>{validationResults.details}</p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-semibold">Log ({debugLog.length} entries)</h4>
                    <div className="pl-2">
                      {debugLog.map((entry, i) => (
                        <div key={i} className="mb-1 font-mono">
                          <span className="text-xs text-gray-500">
                            {entry.timestamp.toLocaleTimeString()} - 
                          </span>
                          <span className="ml-1">{entry.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </Card>
          )}
          
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
