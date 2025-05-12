
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, ChevronRight, AlertTriangle } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  criterion: 'interests' | 'skills' | 'experience';
  majorName: string;
}

export default function OpenEndedQuiz() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [riasecCompleted, setRiasecCompleted] = useState(false);
  const [workValuesCompleted, setWorkValuesCompleted] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // Check if user has completed prerequisites and load questions
  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      setLoadingError(null);
      
      try {
        // Check user authentication
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id || null;
        setUserId(currentUserId);
        
        if (!currentUserId) {
          toast({
            title: "Not logged in",
            description: "Please log in to take the quiz and save your progress.",
            variant: "default",
          });
          navigate("/");
          return;
        }
        
        // Check which quiz segments are completed
        const { data: completions } = await supabase
          .from('quiz_completion')
          .select('quiz_type')
          .eq('user_id', currentUserId);
        
        const completedTypes = completions?.map(c => c.quiz_type) || [];
        console.log("Completed quiz segments:", completedTypes);
        
        // Check if RIASEC-related quizzes are complete
        const isRiasecComplete = 
          completedTypes.includes('interest-part 1') && 
          completedTypes.includes('interest-part 2') && 
          completedTypes.includes('competence');
        
        // Check if Work Values quiz is complete
        const isWorkValuesComplete = completedTypes.includes('work-values');
        
        setRiasecCompleted(isRiasecComplete);
        setWorkValuesCompleted(isWorkValuesComplete);
        
        console.log("Quiz prerequisite status:", {
          riasecCompleted: isRiasecComplete,
          workValuesCompleted: isWorkValuesComplete
        });
        
        if (!isRiasecComplete || !isWorkValuesComplete) {
          setLoadingError("You need to complete all prerequisite quizzes first");
          setLoading(false);
          return;
        }
        
        // Fetch user's RIASEC and work values to determine recommended majors
        const { data: riasecData } = await supabase
          .from('user_responses')
          .select('component, score')
          .eq('user_id', currentUserId)
          .in('quiz_type', ['interest-part 1', 'interest-part 2', 'competence'])
          .not('component', 'is', null);
          
        const { data: workValueData } = await supabase
          .from('user_responses')
          .select('component, score')
          .eq('user_id', currentUserId)
          .eq('quiz_type', 'work-values')
          .not('component', 'is', null);
        
        console.log("RIASEC data:", riasecData);
        console.log("Work Value data:", workValueData);
        
        if (!riasecData?.length || !workValueData?.length) {
          setLoadingError("Missing profile data. Although you've completed the quizzes, we couldn't retrieve your profile data. Please try again later.");
          setLoading(false);
          return;
        }
        
        // Load questions for top recommended majors based on RIASEC and Work Values
        // For simplicity, we'll just load 5 majors randomly for now
        const majorsList = [
          "Computer Science_NUS",
          "Business Administration_NUS",
          "Psychology_NTU",
          "Economics_SMU",
          "Engineering Science_NUS"
        ];
        
        const allQuestions: Question[] = [];
        
        // Load questions for each major
        for (const majorFile of majorsList) {
          try {
            const response = await fetch(`/quiz_refer/Open_ended_quiz_questions/${majorFile}.json`);
            if (response.ok) {
              const majorQuestions = await response.json();
              
              // Group questions by criterion
              const interestsQuestions = majorQuestions.filter((q: any) => q.criterion === 'interests');
              const skillsQuestions = majorQuestions.filter((q: any) => q.criterion === 'skills');
              const experienceQuestions = majorQuestions.filter((q: any) => q.criterion === 'experience');
              
              // Select one question from each category
              if (interestsQuestions.length > 0) {
                const randomInterest = interestsQuestions[Math.floor(Math.random() * interestsQuestions.length)];
                allQuestions.push({
                  ...randomInterest,
                  majorName: majorFile.replace('_', ' at ')
                });
              }
              
              if (skillsQuestions.length > 0) {
                const randomSkill = skillsQuestions[Math.floor(Math.random() * skillsQuestions.length)];
                allQuestions.push({
                  ...randomSkill,
                  majorName: majorFile.replace('_', ' at ')
                });
              }
              
              if (experienceQuestions.length > 0) {
                const randomExp = experienceQuestions[Math.floor(Math.random() * experienceQuestions.length)];
                allQuestions.push({
                  ...randomExp,
                  majorName: majorFile.replace('_', ' at ')
                });
              }
            }
          } catch (err) {
            console.error(`Error loading questions for ${majorFile}:`, err);
          }
        }
        
        console.log(`Loaded ${allQuestions.length} questions`, allQuestions);
        setQuestions(allQuestions);
        
        if (allQuestions.length === 0) {
          setLoadingError("No questions available. Please try again later.");
        }
        
        // Check if user has already completed this quiz
        setCompleted(completedTypes.includes('open-ended'));
        
      } catch (error) {
        console.error('Error loading questions:', error);
        setLoadingError("Failed to load questions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    loadQuestions();
  }, [navigate, toast]);
  
  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  const handleNextQuestion = () => {
    // Validate current response
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    const response = responses[currentQuestion.id];
    if (!response || response.trim().length < 10) {
      toast({
        title: "Response too short",
        description: "Please provide a more detailed answer before continuing.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handleSubmit = async () => {
    if (submitting) return;
    
    // Validate all responses
    const unansweredQuestions = questions.filter(q => 
      !responses[q.id] || responses[q.id].trim() === ''
    );
    
    if (unansweredQuestions.length > 0) {
      toast({
        title: "Missing responses",
        description: `Please answer all ${unansweredQuestions.length} remaining questions before submitting.`,
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      if (!userId) {
        throw new Error("You must be logged in to submit responses");
      }
      
      // Prepare responses for submission
      const responsesToSubmit = questions.map(question => ({
        user_id: userId,
        question_id: question.id,
        response: responses[question.id] || '',
        quiz_type: 'open-ended',
        major: question.majorName,
        criterion: question.criterion
      }));
      
      // Submit responses
      const { error } = await supabase
        .from('user_responses')
        .insert(responsesToSubmit);
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Update quiz completion status
      const { error: completionError } = await supabase
        .from('quiz_completion')
        .upsert({
          user_id: userId,
          quiz_type: 'open-ended'
        }, {
          onConflict: 'user_id, quiz_type'
        });
        
      if (completionError) {
        console.error('Error updating quiz completion:', completionError);
      }
      
      toast({
        title: "Success!",
        description: "Your responses have been submitted successfully.",
      });
      
      setCompleted(true);
      
    } catch (error) {
      console.error('Error submitting responses:', error);
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container max-w-3xl mx-auto py-8 space-y-8">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-32 w-full mt-6" />
        <div className="flex justify-between mt-6">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    );
  }
  
  // Show error if any prerequisites are not completed
  if (loadingError || !riasecCompleted || !workValuesCompleted) {
    return (
      <div className="container max-w-3xl mx-auto py-8 space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Quiz Prerequisites</CardTitle>
            <CardDescription>Before taking this quiz, you need to complete the following:</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-amber-50 dark:bg-amber-900 border-amber-200 dark:border-amber-800 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-800 dark:text-amber-200">
                {loadingError || "Complete Required Quizzes First"}
              </AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                <div className="space-y-2 mt-2">
                  {!riasecCompleted && (
                    <p>• Complete the Interest (Part 1 & 2) and Competence quizzes</p>
                  )}
                  {!workValuesCompleted && (
                    <p>• Complete the Work Values quiz</p>
                  )}
                  {riasecCompleted && workValuesCompleted && loadingError && (
                    <p>• There was an error retrieving your profile data. Please try again later.</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
            
            <p className="text-center mt-6">
              These quizzes help us create personalized questions that are relevant to your interests and values.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate("/")}>Return to Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (completed) {
    return (
      <div className="container max-w-3xl mx-auto py-8 space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Quiz Completed!</CardTitle>
            <CardDescription>Thank you for submitting your responses.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center p-6">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-6 mb-4">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-center mb-4">
              Your answers will help us provide more personalized recommendations.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate("/")}>Return to Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  
  return (
    <div className="container max-w-3xl mx-auto py-8 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Open-Ended Questions</h1>
        <p className="text-muted-foreground">
          Answer questions about specific majors and career paths.
        </p>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {currentQuestion && (
        <Card className="animate-fade-in">
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                {currentQuestion.criterion.charAt(0).toUpperCase() + currentQuestion.criterion.slice(1)}
              </span>
              <span className="text-sm text-muted-foreground">
                {currentQuestion.majorName}
              </span>
            </div>
            <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Type your answer here..."
              className="min-h-[150px]"
              value={responses[currentQuestion.id] || ''}
              onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            <Button 
              onClick={handleNextQuestion}
              disabled={submitting}
            >
              {currentQuestionIndex < questions.length - 1 ? (
                <>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                submitting ? 'Submitting...' : 'Submit All Responses'
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
