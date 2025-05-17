import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useQuiz } from '@/contexts/QuizContext';
import { QuizStep } from './QuizStep';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface QuizFormProps {
  onSubmit: () => void;
  onCancel: () => void;
  quizType?: string;
}

export const QuizForm: React.FC<QuizFormProps> = ({ onSubmit, onCancel, quizType }) => {
  const { toast } = useToast();
  const { 
    currentStep, 
    setCurrentStep, 
    questions,
    isLoading, 
    isSubmitting, 
    error, 
    submitResponses,
    responses,
    debugInfo
  } = useQuiz();
  
  const [questionsByStep, setQuestionsByStep] = useState<Array<Array<any>>>([]);
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [userId, setUserId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setAuthStatus('authenticated');
          setUserId(session.user.id);
          console.log("User authenticated:", session.user.id);
        } else {
          setAuthStatus('unauthenticated');
          setUserId(null);
          console.log("User not authenticated");
        }
      } catch (err) {
        console.error("Error checking authentication:", err);
        setAuthStatus('unauthenticated');
      }
    };
    
    checkAuth();
  }, []);
  
  // Group questions into steps (5 questions per step)
  useEffect(() => {
    if (questions.length > 0) {
      const steps = [];
      for (let i = 0; i < questions.length; i += 5) {
        steps.push(questions.slice(i, i + 5));
      }
      setQuestionsByStep(steps);
    }
  }, [questions]);
  
  // Total steps
  const totalSteps = questionsByStep.length;
  
  // Calculate progress percentage
  const progressPercentage = (currentStep / totalSteps) * 100;
  
  // Handle next step
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle form submission with enhanced error handling
  const handleSubmit = async () => {
    try {
      setSubmissionError(null);
      
      // Check authentication status before submitting
      if (authStatus !== 'authenticated') {
        console.warn("Attempting to submit quiz without authentication");
        toast({
          title: "Authentication required",
          description: "You need to be logged in to save your responses permanently",
          variant: "destructive"
        });
      }
      
      console.log(`Submitting quiz responses with type: ${quizType || 'general'}`);
      console.log('Current responses:', responses);
      console.log('Response count:', Object.keys(responses).length);
      
      // Log current authentication state
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Auth session before submit:", session ? `User ID: ${session.user.id}` : "No active session");
      
      await submitResponses(quizType);
      
      toast({
        title: "Quiz submitted",
        description: "Your responses have been saved successfully.",
      });
      
      onSubmit();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error during quiz submission:", error);
      setSubmissionError(errorMessage);
      
      toast({
        title: "Submission failed",
        description: "There was a problem saving your responses. See details below.",
        variant: "destructive"
      });
    }
  };
  
  // Display loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1E90FF] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quiz questions...</p>
        </div>
      </div>
    );
  }
  
  // Display error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[60vh]">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-red-600">Error</h2>
        <p className="mt-4 text-gray-700">{error}</p>
        <Button onClick={onCancel} className="mt-8">Close</Button>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {/* Authentication status indicator */}
      {authStatus === 'checking' ? (
        <Alert className="mb-4 bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle>Checking authentication status...</AlertTitle>
        </Alert>
      ) : authStatus === 'unauthenticated' ? (
        <Alert className="mb-4 bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle>Not logged in</AlertTitle>
          <AlertDescription>
            Your responses will only be saved locally. Log in to save your progress across devices.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle>Authenticated as {userId}</AlertTitle>
          <AlertDescription>
            Your responses will be saved to your account.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Submission error display */}
      {submissionError && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <XCircle className="h-4 w-4 text-red-500" />
          <AlertTitle>Error saving responses</AlertTitle>
          <AlertDescription>
            {submissionError}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
          <span className="text-sm font-medium">{Math.round(progressPercentage)}% complete</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
      
      {/* Current step questions */}
      {questionsByStep.length > 0 && questionsByStep[currentStep - 1] && (
        <QuizStep questions={questionsByStep[currentStep - 1]} />
      )}
      
      {/* Navigation buttons */}
      <div className="mt-8 flex justify-between">
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-24"
        >
          Cancel
        </Button>
        
        <div className="space-x-2">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="w-24"
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}
          
          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              className="w-24 bg-[#1E90FF] hover:bg-[#1E90FF]/90"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="w-24 bg-[#1E90FF] hover:bg-[#1E90FF]/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><span className="animate-spin mr-1">↻</span> Submitting</>
              ) : (
                'Submit'
              )}
            </Button>
          )}
        </div>
      </div>
      
      {/* Debug information */}
      {debugInfo && process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-md text-xs overflow-auto max-h-60">
          <details>
            <summary className="font-mono font-bold cursor-pointer">Debug Information</summary>
            <pre className="mt-2 whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};
