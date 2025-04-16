
import { useState } from 'react';
import { fromTable, getUserId } from '../utils/databaseHelpers';

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
  const formatResponsesForDb = async () => {
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
        response_array: isArray ? JSON.stringify(response) : null
      };
    });
  };

  // Submit responses to database
  const submitResponses = async () => {
    try {
      setIsSubmitting(true);
      const formattedResponses = await formatResponsesForDb();
      
      // Save responses to database
      const { error: responseError } = await fromTable('user_responses')
        .insert(formattedResponses);
      
      if (responseError) {
        throw new Error(`Failed to save responses: ${responseError.message}`);
      }

      // Return user ID for further processing
      return await getUserId();
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    responses,
    isSubmitting,
    handleResponse,
    submitResponses
  };
};
