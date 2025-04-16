
import { useState, useEffect } from 'react';
import { QuizQuestion } from '@/integrations/supabase/client';
import { fromTable, getUserId } from '../utils/databaseHelpers';
import { getPredefinedQuestions } from '../utils/predefinedQuestions';
import { useToast } from '@/hooks/use-toast';

export const useQuizQuestions = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Insert predefined quiz questions
  const insertPredefinedQuestions = async () => {
    try {
      const { error } = await fromTable('quiz_questions')
        .insert(getPredefinedQuestions());
      
      if (error) {
        throw new Error(`Failed to insert predefined questions: ${error.message}`);
      }
    } catch (err) {
      console.error("Error inserting predefined questions:", err);
      throw err;
    }
  };
  
  // Load quiz questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setIsLoading(true);
        
        // First try to fetch questions from Supabase
        const { data: existingQuestions, error } = await fromTable('quiz_questions')
          .select()
          .order('id');
        
        if (error) {
          console.error("Error loading questions:", error);
          throw new Error(`Failed to load questions: ${error.message}`);
        }
        
        // If no questions exist, we need to insert our predefined questions
        if (!existingQuestions || existingQuestions.length === 0) {
          // Insert predefined questions
          await insertPredefinedQuestions();
          
          // Fetch the newly inserted questions
          const { data: newQuestions, error: newError } = await fromTable('quiz_questions')
            .select()
            .order('id');
            
          if (newError) {
            throw new Error(`Failed to load new questions: ${newError.message}`);
          }
          
          setQuestions((newQuestions as QuizQuestion[]) || []);
        } else {
          setQuestions(existingQuestions as QuizQuestion[]);
        }
      } catch (err) {
        console.error("Error in loadQuestions:", err);
        setError(err instanceof Error ? err.message : "Failed to load questions");
        toast({
          title: "Error",
          description: "Failed to load quiz questions. Please try refreshing.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadQuestions();
  }, [toast]);

  return { questions, isLoading, error };
};
