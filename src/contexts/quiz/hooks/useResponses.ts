
import { useState } from 'react';
import { getUserId } from '../utils/databaseHelpers';
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
      
      // Save responses to Supabase database table
      console.log(`Submitting ${formattedResponses.length} responses for quiz type: ${quizType || 'general'}`);
      console.log('Response data sample:', JSON.stringify(formattedResponses[0]));

      // Using individual upserts for more reliable error handling
      let successCount = 0;
      const errors = [];
      
      for (const response of formattedResponses) {
        const { error } = await supabase
          .from('user_responses')
          .upsert(response, { 
            onConflict: 'user_id,question_id',
            ignoreDuplicates: false 
          });
        
        if (error) {
          console.error(`Error saving response: ${error.message}`);
          errors.push(error.message);
        } else {
          successCount++;
        }
      }

      if (errors.length > 0) {
        console.warn(`${errors.length} errors occurred while saving responses.`);
        console.warn(`First error: ${errors[0]}`);
      }

      console.log(`Successfully saved ${successCount} of ${formattedResponses.length} responses for quiz type: ${quizType || 'general'}`);

      // Save quiz completion status
      if (quizType && successCount > 0) {
        const userId = await getUserId();
        if (userId) {
          const { error: completionError } = await supabase
            .from('quiz_completion')
            .upsert({
              user_id: userId,
              quiz_type: quizType,
              completed_at: new Date().toISOString()
            }, { 
              onConflict: 'user_id,quiz_type',
              ignoreDuplicates: false
            });
            
          if (completionError) {
            console.error('Error saving quiz completion:', completionError);
          } else {
            console.log(`Saved completion status for quiz: ${quizType}`);
          }
        }
      }

      // Return user ID for further processing
      return await getUserId();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Error in submitResponses: ${errorMessage}`);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load user's responses from database
  const loadResponses = async () => {
    try {
      const userId = await getUserId();
      if (!userId) return;

      console.log("Loading responses for user:", userId);

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
        console.log(`Loaded ${data.length} responses from database`);
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
      } else {
        console.log("No responses found for user");
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
