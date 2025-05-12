
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
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);

  const loadQuestions = async (majorName: string) => {
    try {
      setLoadingQuestions(true);
      setSelectedMajor(majorName);
      const [major, school] = majorName.split(' at ');
      const formattedMajor = formatMajorForFile(major, school || '');
      
      // Fetch questions from the JSON file
      const response = await fetch(`/quiz_refer/Open_ended_quiz_questions/${formattedMajor}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load questions for ${majorName}`);
      }
      
      const allQuestions = await response.json() as OpenEndedQuestion[];
      console.log(`Loaded ${allQuestions.length} questions for ${majorName}`);
      
      // Categorize questions by criterion
      const interestQuestions = allQuestions.filter(q => q.criterion.toLowerCase().includes('interest'));
      const skillQuestions = allQuestions.filter(q => q.criterion.toLowerCase().includes('skill'));
      const experienceQuestions = allQuestions.filter(q => 
        q.criterion.toLowerCase().includes('experience') || 
        q.criterion.toLowerCase().includes('background')
      );
      
      console.log(`Found: ${interestQuestions.length} interest questions, ${skillQuestions.length} skill questions, ${experienceQuestions.length} experience questions`);
      
      // Select one random question from each category
      const selectedQuestions: OpenEndedQuestion[] = [];
      
      // Helper function to get a random question from a category
      const getRandomQuestion = (questions: OpenEndedQuestion[]) => {
        if (questions.length === 0) return null;
        return questions[Math.floor(Math.random() * questions.length)];
      };
      
      // Get one question from each category
      const interestQuestion = getRandomQuestion(interestQuestions);
      const skillQuestion = getRandomQuestion(skillQuestions);
      const experienceQuestion = getRandomQuestion(experienceQuestions);
      
      // Add available questions to the selected questions array
      if (interestQuestion) selectedQuestions.push({...interestQuestion, category: 'interests'});
      if (skillQuestion) selectedQuestions.push({...skillQuestion, category: 'skills'});
      if (experienceQuestion) selectedQuestions.push({...experienceQuestion, category: 'experience'});
      
      // If we don't have 3 questions, fill from other categories or general questions
      if (selectedQuestions.length < 3) {
        const remainingQuestions = allQuestions.filter(q => 
          !selectedQuestions.some(sq => sq.id === q.id)
        );
        
        while (selectedQuestions.length < 3 && remainingQuestions.length > 0) {
          const randomIndex = Math.floor(Math.random() * remainingQuestions.length);
          const question = remainingQuestions.splice(randomIndex, 1)[0];
          selectedQuestions.push({
            ...question, 
            category: 'general'
          });
        }
      }
      
      console.log(`Selected ${selectedQuestions.length} questions for the quiz`);
      setQuestions(selectedQuestions);
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
    handleSubmitResponses,
    selectedMajor
  };
};
