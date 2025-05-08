
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
      return {
        user_id: userId,
        question_id: parseInt(questionId),
        response: isArray ? null : response as string,
        response_array: isArray ? JSON.stringify(response) : null,
        quiz_type: quizType || null // Store which quiz this response is for
      };
    });
  };

  // Submit responses to database
  const submitResponses = async (quizType?: string) => {
    try {
      setIsSubmitting(true);
      const formattedResponses = await formatResponsesForDb(quizType);
      
      // Save responses to database using upsert to handle duplicates gracefully
      const { error: responseError } = await fromTable('user_responses')
        .upsert(formattedResponses, { 
          onConflict: 'user_id,question_id',
          ignoreDuplicates: false 
        });
      
      if (responseError) {
        throw new Error(`Failed to save responses: ${responseError.message}`);
      }

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

      const { data, error } = await fromTable('user_responses')
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
            try {
              loadedResponses[item.question_id] = JSON.parse(item.response_array);
            } catch (e) {
              console.error('Error parsing response array:', e);
            }
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
