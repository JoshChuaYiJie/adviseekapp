
import { useState } from 'react';
import { fromTable, getUserId } from '../utils/databaseHelpers';
import { supabase } from '@/integrations/supabase/client';

export const useResponses = () => {
  const [responses, setResponses] = useState<Record<number, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle user responses
  const handleResponse = (questionId: number, response: string | string[]) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: response
    }));
  };

  // Format responses for database
  const formatResponsesForDb = async (quizType?: string) => {
    const userId = await getUserId();
    if (!userId) {
      throw new Error("You must be logged in to submit responses");
    }

    return Object.entries(responses).map(([questionId, response]) => {
      const isArray = Array.isArray(response);
      // Calculate score based on response
      let score = 0;
      if (!isArray && !isNaN(parseInt(response as string))) {
        score = parseInt(response as string);
      }
      
      return {
        user_id: userId,
        question_id: parseInt(questionId),
        response: isArray ? null : response as string,
        response_array: isArray ? response : null,
        quiz_type: quizType || null, // Store which quiz this response is for
        score: score // Add score field for analysis
      };
    });
  };

  // Submit responses to database
  const submitResponses = async (quizType?: string) => {
    try {
      setIsSubmitting(true);
      const formattedResponses = await formatResponsesForDb(quizType);
      
      if (formattedResponses.length === 0) {
        throw new Error("No responses to submit");
      }
      
      // Save responses to database using raw query
      for (const response of formattedResponses) {
        const { error } = await supabase
          .from('user_responses')
          .upsert(response, { 
            onConflict: 'user_id,question_id',
            ignoreDuplicates: false 
          });
        
        if (error) {
          console.error(`Error saving response: ${error.message}`);
        }
      }

      console.log(`Successfully saved ${formattedResponses.length} responses for quiz type: ${quizType || 'general'}`);

      // Return user ID for further processing
      return await getUserId();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load user's responses from database
  const loadResponses = async () => {
    try {
      const userId = await getUserId();
      if (!userId) return;

      // Using the supabase client directly
      const { data, error } = await supabase
        .from('user_responses')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error loading responses:', error);
        return;
      }

      if (data && data.length > 0) {
        const loadedResponses: Record<number, string | string[]> = {};
        
        data.forEach(item => {
          // Handle both string responses and array responses
          if (item.response_array) {
            loadedResponses[item.question_id] = item.response_array as string[];
          } else if (item.response) {
            loadedResponses[item.question_id] = item.response;
          }
        });

        setResponses(loadedResponses);
      }
    } catch (error) {
      console.error('Error in loadResponses:', error);
    }
  };

  return {
    responses,
    isSubmitting,
    handleResponse,
    submitResponses,
    loadResponses
  };
};
