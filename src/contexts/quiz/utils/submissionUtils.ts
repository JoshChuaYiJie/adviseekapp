
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { McqQuestion } from '@/utils/quizQuestions';

export interface SubmitResponsesOptions {
  responses: Record<string | number, string | string[]>;
  questions: McqQuestion[];
  quizType: string;
}

// Submit responses to the database
export const submitResponses = async (options: SubmitResponsesOptions): Promise<boolean> => {
  const { responses, questions, quizType } = options;
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error("You must be logged in to save your responses");
      return false;
    }
    
    // Prepare responses for submission
    const responsesToSubmit = [];
    for (const [questionId, response] of Object.entries(responses)) {
      // Skip questions not in the current batch
      const question = questions.find(q => String(q.id) === String(questionId));
      if (!question) continue;

      // Prepare data based on whether it's an array or string
      const isArrayResponse = Array.isArray(response);
      
      responsesToSubmit.push({
        user_id: session.user.id,
        question_id: questionId,
        response: isArrayResponse ? null : String(response),
        response_array: isArrayResponse ? response : null,
        quiz_type: quizType,
        component: question.component || question.riasec_component || question.work_value_component || ''
      });
    }

    // Use upsert to handle both new and existing responses
    if (responsesToSubmit.length > 0) {
      const { error: upsertError } = await supabase
        .from('user_responses')
        .upsert(responsesToSubmit, {
          onConflict: 'user_id,question_id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        throw upsertError;
      }
    }

    // Mark quiz segment as completed
    const { error: completionError } = await supabase
      .from('quiz_completion')
      .upsert(
        { 
          user_id: session.user.id, 
          quiz_type: quizType,
          completed_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,quiz_type',
          ignoreDuplicates: false
        }
      );

    if (completionError) {
      throw completionError;
    }

    // Update local storage for offline users
    const existingCompletions = localStorage.getItem('completed_quiz_segments');
    const completions = existingCompletions ? JSON.parse(existingCompletions) : [];
    if (!completions.includes(quizType)) {
      completions.push(quizType);
      localStorage.setItem('completed_quiz_segments', JSON.stringify(completions));
    }
    
    toast.success("Responses saved successfully!");
    return true;
  } catch (error) {
    console.error("Failed to submit responses:", error);
    toast.error("Failed to save your responses. Please try again.");
    return false;
  }
};
