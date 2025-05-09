import { useState } from 'react';
import { getUserId, testInsertResponse } from '../utils/databaseHelpers';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';

export const useResponses = () => {
  const { toast } = useToast();
  const [responses, setResponses] = useState<Record<number, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Handle user responses
  const handleResponse = (questionId: number, response: string | string[]) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: response
    }));
  };

  // Format responses for database
  const formatResponsesForDb = async (quizType?: string) => {
    // Get current user ID with detailed logging
    console.log("Fetching current user ID for response formatting...");
    const userId = await getUserId();
    
    if (!userId) {
      const authError = new Error("You must be logged in to submit responses");
      console.error("Authentication error:", authError);
      setLastError(authError);
      throw authError;
    }
    
    console.log(`Formatting responses for user ${userId}, quiz type: ${quizType || 'general'}`);

    const formattedResponses = Object.entries(responses).map(([questionId, response]) => {
      const isArray = Array.isArray(response);
      // Calculate score based on response
      let score = 0;
      if (!isArray && !isNaN(parseInt(response as string))) {
        score = parseInt(response as string);
      }
      
      const responseObj = {
        user_id: userId,
        question_id: questionId, // Make sure this is a string to match the database schema
        response: isArray ? null : response as string,
        response_array: isArray ? response : null,
        quiz_type: quizType || null, // Store which quiz this response is for
        score: score // Add score field for analysis
      };
      
      return responseObj;
    });
    
    // Log the formatted responses for debugging
    console.log(`Formatted ${formattedResponses.length} responses:`, 
                formattedResponses.length > 0 ? formattedResponses[0] : "No responses");
    
    return formattedResponses;
  };

  // Submit responses to database with enhanced error handling
  const submitResponses = async (quizType?: string) => {
    // Clear previous error state
    setLastError(null);
    setDebugInfo(null);
    
    try {
      setIsSubmitting(true);
      
      // Get authentication session for verification
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const authError = new Error("No authenticated session found. Please log in to save responses.");
        console.error("Auth check failed:", authError);
        setLastError(authError);
        toast({
          title: "Authentication required",
          description: "Please log in to save your responses",
          variant: "destructive"
        });
        return null;
      }
      
      console.log("User authenticated with ID:", session.user.id);
      console.log("Preparing to save responses for quiz:", quizType);
      
      const formattedResponses = await formatResponsesForDb(quizType);
      
      if (formattedResponses.length === 0) {
        const emptyError = new Error("No responses to submit");
        console.warn(emptyError.message);
        setLastError(emptyError);
        throw emptyError;
      }
      
      // Save responses to Supabase database table
      console.log(`Submitting ${formattedResponses.length} responses for quiz type: ${quizType || 'general'}`);
      console.log('Response data sample:', JSON.stringify(formattedResponses[0]));

      // Using individual upserts for more reliable error handling
      let successCount = 0;
      const errors = [];
      const debugDetails = [];
      
      for (const response of formattedResponses) {
        console.log(`Upserting response for question ${response.question_id}:`, response);
        
        const { data, error } = await supabase
          .from('user_responses')
          .upsert({
            user_id: response.user_id,
            question_id: String(response.question_id), // Convert to string to match database schema
            response: response.response,
            response_array: response.response_array,
            quiz_type: response.quiz_type,
            score: response.score
          }, { 
            onConflict: 'user_id,question_id',
            ignoreDuplicates: false 
          });
        
        if (error) {
          console.error(`Error saving response for question ${response.question_id}:`, error);
          debugDetails.push({ 
            question_id: response.question_id, 
            error: { 
              code: error.code,
              message: error.message,
              hint: error.hint,
              details: error.details
            },
            data: response
          });
          errors.push(error.message);
        } else {
          successCount++;
          debugDetails.push({ 
            question_id: response.question_id, 
            success: true,
            data: response
          });
        }
      }

      if (errors.length > 0) {
        console.warn(`${errors.length} errors occurred while saving responses.`);
        console.warn(`First error: ${errors[0]}`);
        
        setDebugInfo({
          type: 'response_errors',
          errors: errors,
          details: debugDetails
        });
        
        if (successCount === 0) {
          // All submissions failed
          const saveError = new Error(`Failed to save responses: ${errors[0]}`);
          setLastError(saveError);
          toast({
            title: "Error saving responses",
            description: `${errors[0].substring(0, 100)}${errors[0].length > 100 ? '...' : ''}`,
            variant: "destructive"
          });
          return null;
        } else {
          // Some submissions succeeded
          toast({
            title: "Partial success",
            description: `Saved ${successCount} of ${formattedResponses.length} responses. Some errors occurred.`,
            variant: "destructive"
          });
        }
      }

      console.log(`Successfully saved ${successCount} of ${formattedResponses.length} responses for quiz type: ${quizType || 'general'}`);

      // Save quiz completion status
      if (quizType && successCount > 0) {
        const userId = await getUserId();
        if (userId) {
          console.log(`Saving completion status for quiz: ${quizType}`);
          
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
            setDebugInfo(prev => ({
              ...prev,
              completion_error: completionError
            }));
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
      
      setLastError(error instanceof Error ? error : new Error(String(error)));
      setDebugInfo(prev => ({
        ...prev,
        exception: error
      }));
      
      toast({
        title: "Error submitting responses",
        description: errorMessage.substring(0, 150),
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load user's responses from database with enhanced error handling
  const loadResponses = async () => {
    try {
      const userId = await getUserId();
      if (!userId) {
        console.log("Cannot load responses: No authenticated user");
        return;
      }

      console.log("Loading responses for user:", userId);

      // Using the supabase client directly
      const { data, error } = await supabase
        .from('user_responses')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error loading responses:', error);
        setLastError(new Error(`Failed to load responses: ${error.message}`));
        setDebugInfo({ 
          type: 'load_error',
          error: error 
        });
        toast({
          title: "Error loading responses",
          description: error.message,
          variant: "destructive"
        });
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
        
        // Log the first few loaded responses for debugging
        const sampleKeys = Object.keys(loadedResponses).slice(0, 3);
        if (sampleKeys.length > 0) {
          console.log("Sample of loaded responses:", 
            sampleKeys.map(key => ({
              question_id: key,
              response: loadedResponses[Number(key)]
            }))
          );
        }
      } else {
        console.log("No responses found for user");
      }
    } catch (error) {
      console.error('Error in loadResponses:', error);
      setLastError(error instanceof Error ? error : new Error(String(error)));
      setDebugInfo({ 
        type: 'load_exception',
        error: error 
      });
    }
  };

  // Manual test function to verify permissions and constraints
  const testResponseInsert = async () => {
    try {
      const { success, message, details } = await testInsertResponse();
      
      if (success) {
        toast({
          title: "Test successful",
          description: "Successfully inserted test response",
          variant: "default"
        });
      } else {
        toast({
          title: "Test failed",
          description: message,
          variant: "destructive"
        });
      }
      
      setDebugInfo({
        type: 'test_insert',
        success,
        message,
        details
      });
      
      return { success, message, details };
    } catch (error) {
      console.error('Error in testResponseInsert:', error);
      setLastError(error instanceof Error ? error : new Error(String(error)));
      setDebugInfo({ 
        type: 'test_exception',
        error: error 
      });
      
      return { 
        success: false, 
        message: "Exception occurred", 
        details: error 
      };
    }
  };

  return {
    responses,
    isSubmitting,
    lastError,
    debugInfo,
    handleResponse,
    submitResponses,
    loadResponses,
    testResponseInsert
  };
};
