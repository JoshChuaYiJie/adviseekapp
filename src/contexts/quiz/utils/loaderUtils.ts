
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { McqQuestion } from '@/utils/quizQuestions';

// Load questions based on current step
export const loadQuizQuestions = async (currentStep: number): Promise<McqQuestion[]> => {
  try {
    // Load questions based on current step
    let questionsJsonPath = '';
    if (currentStep === 1) {
      questionsJsonPath = './quiz_refer/Mcq_questions/RIASEC_interest_questions_pt1.json';
    } else if (currentStep === 2) {
      questionsJsonPath = './quiz_refer/Mcq_questions/RIASEC_interest_questions_pt2.json';
    } else if (currentStep === 3) {
      questionsJsonPath = './quiz_refer/Mcq_questions/RIASEC_competence_questions.json';
    } else if (currentStep === 4) {
      questionsJsonPath = './quiz_refer/Mcq_questions/Work_value_questions.json';
    }

    if (!questionsJsonPath) {
      throw new Error(`Invalid quiz step: ${currentStep}`);
    }

    // Debug logging to help diagnose path issues
    console.log(`Attempting to fetch questions from: ${questionsJsonPath}`);
    
    const response = await fetch(questionsJsonPath);
    
    if (!response.ok) {
      console.error(`Failed to fetch questions: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch questions: ${response.status} ${response.statusText}`);
    }
    
    const loadedQuestions: McqQuestion[] = await response.json();
    console.log(`Loaded ${loadedQuestions.length} questions from ${questionsJsonPath}`);
    
    // Add category property based on the current step if it doesn't exist
    const questionsWithCategory = loadedQuestions.map(q => ({
      ...q,
      category: q.category || `interest-part ${currentStep}`,
      id: q.id || String(Math.random())
    }));
    
    return questionsWithCategory;
  } catch (error) {
    console.error("Failed to load questions:", error);
    throw error;
  }
};

// Load user responses from the database
export const loadUserResponses = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return {}; // Not logged in

    console.log("Loading responses for user:", session.user.id);
    
    const { data, error } = await supabase
      .from('user_responses')
      .select('question_id, response, response_array')
      .eq('user_id', session.user.id);
    
    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      console.log("Loaded", data.length, "responses from database");
      console.log("Sample of loaded responses:", data.slice(0, 3));
      
      const loadedResponses: Record<string | number, string | string[]> = {};
      data.forEach(item => {
        // Handle both string responses and array responses
        if (item.response_array) {
          loadedResponses[item.question_id] = item.response_array as string[];
        } else if (item.response) {
          loadedResponses[item.question_id] = item.response;
        }
      });
      
      return loadedResponses;
    }
    
    return {};
  } catch (error) {
    console.error("Failed to load user responses:", error);
    return {};
  }
};

