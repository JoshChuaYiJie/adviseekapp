
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useQuiz } from '@/contexts/QuizContext';
import { QuizStep } from './QuizStep';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

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
    responses
  } = useQuiz();
  
  const [questionsByStep, setQuestionsByStep] = useState<Array<Array<any>>>([]);
  
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
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      console.log(`Submitting quiz responses with type: ${quizType || 'general'}`);
      console.log('Current responses:', responses);
      
      await submitResponses(quizType);
      
      toast({
        title: "Quiz submitted",
        description: "Your responses have been saved successfully.",
      });
      
      onSubmit();
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "There was a problem saving your responses. Please try again.",
        variant: "destructive"
      });
      console.error("Error during quiz submission:", error);
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
        <h2 className="text-2xl font-bold text-red-600">Error</h2>
        <p className="mt-4 text-gray-700">{error}</p>
        <Button onClick={onCancel} className="mt-8">Close</Button>
      </div>
    );
  }
  
  return (
    <div className="p-6">
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
    </div>
  );
};
