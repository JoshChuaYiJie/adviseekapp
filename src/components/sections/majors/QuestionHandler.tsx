
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OpenEndedQuestion, OpenEndedResponse } from './types';
import { formatMajorForFile } from './MajorUtils';

interface QuestionHandlerProps {
  userId: string | null;
}

export const useQuestionHandler = ({ userId }: QuestionHandlerProps) => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<OpenEndedQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const loadQuestions = async (majorName: string) => {
    try {
      setLoadingQuestions(true);
      const formattedMajor = formatMajorForFile(majorName);
      
      // Fetch questions from the JSON file
      const response = await fetch(`/school-data/Application Questions/${formattedMajor}`);
      if (!response.ok) {
        throw new Error(`Failed to load questions for ${majorName}`);
      }
      
      const data = await response.json() as OpenEndedQuestion[];
      setQuestions(data);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: "Error",
        description: "Failed to load questions for this major.",
        variant: "destructive"
      });
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSubmitResponses = async (selectedMajor: string | null) => {
    if (!selectedMajor) {
      toast({
        title: "No Major Selected",
        description: "Please select a major before submitting your responses.",
        variant: "destructive"
      });
      return;
    }
    
    if (!userId) {
      toast({
        title: "Not Logged In",
        description: "Please log in to save your responses.",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    try {
      // Prepare responses for database - convert to the format expected by the user_responses table
      const responsesToSubmit = questions.map(question => ({
        user_id: userId,
        question_id: question.id || '',
        response: answeredQuestions[question.id || ''] || '',
        quiz_type: 'open-ended'
      }));
      
      // Upload responses to Supabase user_responses table
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
      } else {
        setCompleted(true);
        toast({
          title: "Responses Submitted",
          description: "Your responses have been successfully submitted!",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error submitting responses:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your responses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    questions,
    loadingQuestions,
    answeredQuestions,
    setAnsweredQuestions,
    submitting,
    completed,
    loadQuestions,
    handleSubmitResponses
  };
};
