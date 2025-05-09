import { supabase } from "@/integrations/supabase/client";
import { type Json } from "@/integrations/supabase/types";

// Helper function to make type-safe Supabase queries
export function fromTable<T extends string>(tableName: T) {
  // Use "as any" to bypass TypeScript's type checking for this operation
  return supabase.from(tableName as any);
}

// Get current user ID helper with enhanced debugging
export const getUserId = async (): Promise<string | null> => {
  try {
    // Fetch the current session with detailed logging
    console.log("Fetching current user session...");
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Error getting session:", sessionError);
      return null;
    }
    
    if (!session) {
      console.log("No active session found - user is not authenticated");
      return null;
    }
    
    console.log("User authenticated with ID:", session.user?.id);
    return session?.user?.id || null;
  } catch (error) {
    console.error("Exception in getUserId:", error);
    return null;
  }
};

// Function to validate RLS policies and constraints
export const validateUserResponsesTable = async (): Promise<{
  success: boolean;
  hasUniqueConstraint: boolean;
  hasRlsEnabled: boolean;
  hasCorrectPolicy: boolean;
  details: string;
}> => {
  try {
    console.log("Validating user_responses table configuration...");
    
    // Check for RLS enabled
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('check_table_rls', { table_name: 'user_responses' });
      
    if (rlsError) {
      console.error("Error checking RLS:", rlsError);
      return {
        success: false,
        hasUniqueConstraint: false,
        hasRlsEnabled: false,
        hasCorrectPolicy: false,
        details: `Error checking RLS: ${rlsError.message}`
      };
    }
    
    const hasRlsEnabled = rlsData === true;
    console.log("RLS enabled on user_responses:", hasRlsEnabled);
    
    // Check for unique constraint on user_id and question_id
    const { data: constraintData, error: constraintError } = await supabase
      .rpc('check_unique_constraint', { 
        table_name: 'user_responses', 
        column_names: ['user_id', 'question_id'] 
      });
      
    if (constraintError) {
      console.error("Error checking constraint:", constraintError);
      return {
        success: false,
        hasUniqueConstraint: false,
        hasRlsEnabled: hasRlsEnabled,
        hasCorrectPolicy: false,
        details: `Error checking constraint: ${constraintError.message}`
      };
    }
    
    const hasUniqueConstraint = constraintData === true;
    console.log("Unique constraint exists on (user_id, question_id):", hasUniqueConstraint);
    
    // Check for correct RLS policy
    const { data: policyData, error: policyError } = await supabase
      .rpc('check_policy_exists', { 
        table_name: 'user_responses', 
        policy_name: 'Users can insert their own responses' 
      });
      
    if (policyError) {
      console.error("Error checking policy:", policyError);
      return {
        success: false,
        hasUniqueConstraint: hasUniqueConstraint,
        hasRlsEnabled: hasRlsEnabled,
        hasCorrectPolicy: false,
        details: `Error checking policy: ${policyError.message}`
      };
    }
    
    const hasCorrectPolicy = policyData === true;
    console.log("Correct RLS policy exists:", hasCorrectPolicy);
    
    return {
      success: true,
      hasUniqueConstraint,
      hasRlsEnabled,
      hasCorrectPolicy,
      details: `Table validated: RLS=${hasRlsEnabled}, UniqueConstraint=${hasUniqueConstraint}, CorrectPolicy=${hasCorrectPolicy}`
    };
  } catch (error) {
    console.error("Exception in validateUserResponsesTable:", error);
    return {
      success: false,
      hasUniqueConstraint: false,
      hasRlsEnabled: false,
      hasCorrectPolicy: false,
      details: `Exception: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// Test function to manually insert a response to verify permissions
export const testInsertResponse = async (): Promise<{
  success: boolean;
  message: string;
  details: any;
}> => {
  try {
    const userId = await getUserId();
    
    if (!userId) {
      return {
        success: false,
        message: "Cannot test insert: No authenticated user found",
        details: null
      };
    }
    
    // Create a test response
    const testResponse = {
      user_id: userId,
      question_id: 9999, // Use a high number unlikely to conflict
      response: "This is a test response",
      quiz_type: "test",
      score: 0
    };
    
    console.log("Attempting test insert with data:", testResponse);
    
    const { data, error } = await fromTable('user_responses')
      .upsert(testResponse, { 
        onConflict: 'user_id,question_id',
        ignoreDuplicates: false 
      });
      
    if (error) {
      console.error("Test insert failed:", error);
      return {
        success: false,
        message: `Test insert failed: ${error.message}`,
        details: error
      };
    }
    
    console.log("Test insert succeeded:", data);
    return {
      success: true,
      message: "Test insert successful",
      details: data
    };
  } catch (error) {
    console.error("Exception in testInsertResponse:", error);
    return {
      success: false,
      message: `Exception during test insert: ${error instanceof Error ? error.message : String(error)}`,
      details: error
    };
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
