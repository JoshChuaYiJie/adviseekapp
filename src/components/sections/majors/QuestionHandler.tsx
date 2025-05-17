
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MajorQuestionDisplay } from './MajorQuestionDisplay';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface QuestionHandlerProps {
  questions: {
    question: string;
    id: number;
    type: string;
  }[];
  majorName: string;
}

export const QuestionHandler = ({ questions, majorName }: QuestionHandlerProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize responses state for all questions
  useEffect(() => {
    const initialResponses: Record<number, string> = {};
    questions.forEach((_, index) => {
      initialResponses[index] = '';
    });
    setResponses(initialResponses);
  }, [questions]);

  const handleResponseChange = (response: string) => {
    setResponses({
      ...responses,
      [currentQuestionIndex]: response
    });
  };

  const handleNext = () => {
    // Move to the next question if available
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    
    // Verify user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      toast({
        title: "Not logged in",
        description: "Please log in to save your responses.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Filter out empty responses
      const responsesToSave = Object.entries(responses)
        .filter(([_, response]) => response.trim() !== '')
        .map(([index, response]) => {
          const questionIndex = parseInt(index, 10);
          return {
            user_id: userId,
            question: questions[questionIndex].question,
            response: response,
            major: majorName
          };
        });
      
      if (responsesToSave.length > 0) {
        // Save valid responses to database
        const { error } = await supabase
          .from('open_ended_responses')
          .insert(responsesToSave);
          
        if (error) {
          console.error("Error saving responses:", error);
          toast({
            title: "Error saving responses",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Responses saved successfully",
            description: `Saved ${responsesToSave.length} response(s)`,
          });
        }
      } else {
        toast({
          title: "No responses to save",
          description: "You didn't provide any responses to save.",
        });
      }
      
      // Navigate back to recommendations
      navigate('/recommendations');
      
    } catch (error) {
      console.error("Error in handleFinish:", error);
      toast({
        title: "Something went wrong",
        description: "Failed to save responses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Early return if no questions
  if (questions.length === 0) {
    return <div className="p-4 text-center">
      <p>No questions available for this major.</p>
      <Button 
        className="mt-4"
        onClick={() => navigate('/recommendations')}
      >
        Back to Recommendations
      </Button>
    </div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">
        Question {currentQuestionIndex + 1} of {questions.length}
      </h2>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {questions.map((_, index) => (
          <div 
            key={index} 
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs cursor-pointer
              ${index === currentQuestionIndex ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
              ${responses[index] && responses[index].trim() !== '' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            onClick={() => setCurrentQuestionIndex(index)}
          >
            {index + 1}
          </div>
        ))}
      </div>
      
      <MajorQuestionDisplay 
        question={currentQuestion.question}
        response={responses[currentQuestionIndex] || ''}
        onResponseChange={handleResponseChange}
      />
      
      <div className="flex justify-between pt-4">
        <Button 
          onClick={handleBack} 
          disabled={currentQuestionIndex === 0}
          variant="outline"
        >
          Back
        </Button>
        
        <div className="space-x-2">
          {!isLastQuestion ? (
            <Button 
              onClick={handleNext}
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleFinish}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Finish"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
