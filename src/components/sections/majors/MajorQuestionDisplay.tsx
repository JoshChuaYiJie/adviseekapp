
import { useState } from 'react';
import { useTheme } from "@/contexts/ThemeContext";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { InfoIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { OpenEndedQuestion } from './types';
import { useToast } from '@/hooks/use-toast';

interface MajorQuestionDisplayProps {
  selectedMajor: string | null;
  openEndedQuestions: OpenEndedQuestion[];
  loadingQuestions: boolean;
  onBackToList: () => void;
  isQuizMode?: boolean; 
  onSubmitResponses?: () => void;
}

export const MajorQuestionDisplay = ({ 
  selectedMajor,
  openEndedQuestions,
  loadingQuestions,
  onBackToList,
  isQuizMode = false,
  onSubmitResponses
}: MajorQuestionDisplayProps) => {
  const { isCurrentlyDark } = useTheme();
  const { toast } = useToast();
  
  // State for storing user responses
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!selectedMajor) return null;

  // Handle text input changes
  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Handle form submission
  const handleSubmit = () => {
    // Only proceed if in quiz mode and we have a submission handler
    if (!isQuizMode || !onSubmitResponses) return;

    // Validate that all questions have responses
    const unansweredQuestions = openEndedQuestions.filter(q => 
      !responses[q.id || ''] || responses[q.id || ''].trim() === ''
    );

    if (unansweredQuestions.length > 0) {
      toast({
        title: "Missing responses",
        description: "Please answer all questions before submitting.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    
    try {
      // Call the parent's submission handler
      onSubmitResponses();
      
      toast({
        title: "Responses submitted",
        description: "Your answers have been saved successfully!",
        variant: "default"
      });
    } catch (error) {
      console.error('Error submitting responses:', error);
      toast({
        title: "Submission error",
        description: "There was a problem saving your answers. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium">{selectedMajor} Questions</h3>
        <Button 
          onClick={onBackToList} 
          variant="outline" 
          size="sm"
        >
          Back to Majors
        </Button>
      </div>
      
      {loadingQuestions ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : openEndedQuestions.length > 0 ? (
        <div className="space-y-6">
          {openEndedQuestions.map((q, index) => (
            <Card key={index} className={`p-4 ${isCurrentlyDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="space-y-3">
                <Badge className="mb-2">{q.criterion}</Badge>
                <p className="text-md">{q.question}</p>
                
                {isQuizMode && (
                  <Textarea
                    className={`mt-2 ${isCurrentlyDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                    placeholder="Type your answer here..."
                    rows={4}
                    value={responses[q.id || ''] || ''}
                    onChange={(e) => handleResponseChange(q.id || '', e.target.value)}
                  />
                )}
              </div>
            </Card>
          ))}
          
          {isQuizMode && (
            <div className="flex justify-end mt-4">
              <Button 
                onClick={handleSubmit} 
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></span>
                    Submitting...
                  </>
                ) : (
                  <>Submit Answers</>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className={`p-6 rounded-lg text-center ${isCurrentlyDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
          <InfoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h4 className="text-lg font-medium mb-2">No Questions Available</h4>
          <p>
            We couldn't find any questions for this major. Please try another major.
          </p>
        </div>
      )}
    </div>
  );
};
