
import { supabase } from "@/integrations/supabase/client";
import type { TableName } from "@/integrations/supabase/client";

// Helper function to make type-safe Supabase queries
export function fromTable(tableName: TableName) {
  return supabase.from(tableName);
}

// Get current user ID helper
export const getUserId = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch (error) {
    console.error("Error getting user ID:", error);
    return null;
  }
};

// Calculate RIASEC profile from user responses
export const calculateRiasecProfile = async (userId: string): Promise<Record<string, number>> => {
  try {
    // Get user responses for RIASEC-related quizzes
    const { data, error } = await supabase
      .from('user_responses')
      .select('*')
      .eq('user_id', userId)
      .in('quiz_type', ['interest-part 1', 'interest-part 2', 'competence']);
    
    if (error) throw error;
    if (!data || data.length === 0) return {};
    
    // Define RIASEC components
    const riasecComponents = {
      'R': 0, // Realistic
      'I': 0, // Investigative
      'A': 0, // Artistic
      'S': 0, // Social
      'E': 0, // Enterprising
      'C': 0  // Conventional
    };
    
    // Map question IDs to RIASEC categories (simplified example)
    // This would be based on your actual question mappings
    const questionToRiasec: Record<number, keyof typeof riasecComponents> = {
      // Map your questions to RIASEC components
      // Example: 1: 'R', 2: 'I', etc.
      1: 'R', 2: 'I', 3: 'A', 4: 'S', 5: 'E', 6: 'C',
      7: 'R', 8: 'I', 9: 'A', 10: 'S', 11: 'E', 12: 'C',
      // Add more mappings based on your actual questions
    };
    
    // Calculate scores for each component
    data.forEach(response => {
      const component = questionToRiasec[response.question_id];
      if (component) {
        let score = response.score || 0;
        // If no score is available, try to derive from string response
        if (score === 0 && response.response) {
          const numericResponse = parseInt(response.response);
          if (!isNaN(numericResponse)) {
            score = numericResponse;
          }
        }
        riasecComponents[component] += score;
      }
    });
    
    return riasecComponents;
  } catch (error) {
    console.error("Error calculating RIASEC profile:", error);
    return {};
  }
};

// Calculate Work Values profile from user responses
export const calculateWorkValuesProfile = async (userId: string): Promise<Record<string, number>> => {
  try {
    // Get user responses for work values quiz
    const { data, error } = await supabase
      .from('user_responses')
      .select('*')
      .eq('user_id', userId)
      .eq('quiz_type', 'work-values');
    
    if (error) throw error;
    if (!data || data.length === 0) return {};
    
    // Define work value categories
    const workValues = {
      'Achievement': 0,
      'Independence': 0,
      'Recognition': 0,
      'Relationships': 0,
      'Support': 0,
      'Working Conditions': 0
    };
    
    // Map question IDs to work value categories (simplified example)
    // This would be based on your actual question mappings
    const questionToWorkValue: Record<number, keyof typeof workValues> = {
      // Map your questions to work value categories
      // Example: 100: 'Achievement', 101: 'Independence', etc.
      100: 'Achievement', 101: 'Independence', 102: 'Recognition',
      103: 'Relationships', 104: 'Support', 105: 'Working Conditions',
      // Add more mappings based on your actual questions
    };
    
    // Calculate scores for each category
    data.forEach(response => {
      const category = questionToWorkValue[response.question_id];
      if (category) {
        let score = response.score || 0;
        if (score === 0 && response.response) {
          const numericResponse = parseInt(response.response);
          if (!isNaN(numericResponse)) {
            score = numericResponse;
          }
        }
        workValues[category] += score;
      }
    });
    
    return workValues;
  } catch (error) {
    console.error("Error calculating work values profile:", error);
    return {};
  }
};
