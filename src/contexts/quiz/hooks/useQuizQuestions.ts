
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { QuizQuestion } from '@/integrations/supabase/client';
import { RIASEC_INTEREST_PART1, RIASEC_INTEREST_PART2, RIASEC_COMPETENCE, WORK_VALUES } from '../utils/predefinedQuestions';

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

        // Map segment to the appropriate question set
        let questionSet: QuizQuestion[] = [];
        
        if (segment === 'interest-part 1') {
          questionSet = RIASEC_INTEREST_PART1;
        } else if (segment === 'interest-part 2') {
          questionSet = RIASEC_INTEREST_PART2;
        } else if (segment === 'competence') {
          questionSet = RIASEC_COMPETENCE;
        } else if (segment === 'work-values') {
          questionSet = WORK_VALUES;
        } else {
          throw new Error(`No questions found for segment: ${segment}`);
        }
        
        setQuestions(questionSet);
        console.log(`Loaded ${questionSet.length} predefined questions for ${segment}`);
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
