
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { QuizQuestion } from '@/integrations/supabase/client';
import predefinedQuestions from '../utils/predefinedQuestions';

export const useQuizQuestions = (segment?: string) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!segment) {
      setQuestions([]);
      setIsLoading(false);
      return;
    }

    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to fetch questions from the database first
        const { data, error } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('section', segment);
        
        if (error) {
          console.warn(`Error fetching questions from database: ${error.message}. Falling back to predefined questions.`);
          
          // Fall back to predefined questions
          if (segment in predefinedQuestions) {
            const sectionQuestions = predefinedQuestions[segment as keyof typeof predefinedQuestions];
            setQuestions(sectionQuestions);
          } else {
            throw new Error(`No questions found for segment: ${segment}`);
          }
        } else if (data && data.length > 0) {
          // Use data from database if available
          setQuestions(data as QuizQuestion[]);
          console.log(`Loaded ${data.length} questions for ${segment} from database`);
        } else {
          // Fall back to predefined questions
          if (segment in predefinedQuestions) {
            const sectionQuestions = predefinedQuestions[segment as keyof typeof predefinedQuestions];
            setQuestions(sectionQuestions);
            console.log(`Loaded ${sectionQuestions.length} predefined questions for ${segment}`);
          } else {
            throw new Error(`No questions found for segment: ${segment}`);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load quiz questions';
        setError(errorMessage);
        console.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [segment]);

  return {
    questions,
    isLoading,
    error
  };
};
