
import { supabase } from "@/integrations/supabase/client";
import { type Json } from "@/integrations/supabase/types";

// Define the type for validation result
interface ValidationResult {
  success: boolean;
  hasUniqueConstraint: boolean;
  hasRlsEnabled: boolean;
  hasCorrectPolicy: boolean;
  details: string;
}

// Define the type for user response
interface UserResponse {
  user_id: string;
  question_id: string;
  response: string | null;
  response_array: string[] | null;
  quiz_type: string | null;
  score: number;
  [key: string]: any;
}

// Define RIASEC score types
type RiasecScores = {
  R: number; // Realistic
  I: number; // Investigative
  A: number; // Artistic
  S: number; // Social
  E: number; // Enterprising
  C: number; // Conventional
};

// Define Work Values score types
type WorkValuesScores = {
  Achievement: number;
  Independence: number;
  Recognition: number;
  Relationships: number;
  Support: number;
  WorkingConditions: number;
};

// Define RPC parameter types
type CheckTableRlsParams = { table_name: string };
type CheckUniqueConstraintParams = { table_name: string; column_names: string[] };
type CheckPolicyExistsParams = { table_name: string; policy_name: string };

// Helper function to safely make Supabase queries with dynamic table names
export function fromTable(tableName: string) {
  // Using type assertion to allow dynamic table names
  return supabase.from(tableName as any);
}

export const getUserId = async (): Promise<string | null> => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Error getting session:", sessionError);
      return null;
    }
    
    if (!session) {
      console.log("No active session found - user is not authenticated");
      return null;
    }
    
    return session.user?.id || null;
  } catch (error) {
    console.error("Exception in getUserId:", error);
    return null;
  }
};

export const calculateRiasecProfile = async (userId: string): Promise<RiasecScores> => {
  try {
    const { data, error } = await fromTable('user_responses')
      .select('question_id, response, score')
      .eq('user_id', userId)
      .eq('quiz_type', 'interest');

    if (error) {
      console.error("Error fetching RIASEC responses:", error);
      return { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    }

    const riasecScores: RiasecScores = {
      R: 0, I: 0, A: 0, S: 0, E: 0, C: 0
    };

    // Type guard to ensure data is an array of UserResponse
    if (Array.isArray(data)) {
      data.forEach((response: any) => {
        if (response && response.score && response.question_id && response.question_id.startsWith('RIASEC_')) {
          const category = response.question_id.split('_')[1][0] as keyof RiasecScores;
          if (category in riasecScores) {
            riasecScores[category] += response.score;
          }
        }
      });
    }

    return riasecScores;
  } catch (error) {
    console.error("Error calculating RIASEC profile:", error);
    return { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  }
};

export const calculateWorkValuesProfile = async (userId: string): Promise<WorkValuesScores> => {
  try {
    const { data, error } = await fromTable('user_responses')
      .select('question_id, response, score')
      .eq('user_id', userId)
      .eq('quiz_type', 'work_values');

    if (error) {
      console.error("Error fetching Work Values responses:", error);
      return {
        Achievement: 0,
        Independence: 0,
        Recognition: 0,
        Relationships: 0,
        Support: 0,
        WorkingConditions: 0
      };
    }

    const workValuesScores: WorkValuesScores = {
      Achievement: 0,
      Independence: 0,
      Recognition: 0,
      Relationships: 0,
      Support: 0,
      WorkingConditions: 0
    };

    // Type guard to ensure data is an array of UserResponse
    if (Array.isArray(data)) {
      data.forEach((response: any) => {
        if (response && response.score && response.question_id && response.question_id.startsWith('WV_')) {
          const categoryFull = response.question_id.split('_')[1];
          const category = categoryFull as keyof WorkValuesScores;
          
          if (category in workValuesScores) {
            workValuesScores[category] += response.score;
          }
        }
      });
    }

    return workValuesScores;
  } catch (error) {
    console.error("Error calculating Work Values profile:", error);
    return {
      Achievement: 0,
      Independence: 0,
      Recognition: 0,
      Relationships: 0,
      Support: 0,
      WorkingConditions: 0
    };
  }
};

export const validateUserResponsesTable = async (): Promise<ValidationResult> => {
  try {
    // Check for RLS enabled
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('check_table_rls', {
        table_name: 'user_responses'
      } as CheckTableRlsParams);

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

    // Check for unique constraint
    const { data: constraintData, error: constraintError } = await supabase
      .rpc('check_unique_constraint', {
        table_name: 'user_responses',
        column_names: ['user_id', 'question_id']
      } as CheckUniqueConstraintParams);

    if (constraintError) {
      console.error("Error checking constraint:", constraintError);
      return {
        success: false,
        hasUniqueConstraint: false,
        hasRlsEnabled,
        hasCorrectPolicy: false,
        details: `Error checking constraint: ${constraintError.message}`
      };
    }

    const hasUniqueConstraint = constraintData === true;

    // Check for policy
    const { data: policyData, error: policyError } = await supabase
      .rpc('check_policy_exists', {
        table_name: 'user_responses',
        policy_name: 'Users can insert their own responses'
      } as CheckPolicyExistsParams);

    if (policyError) {
      console.error("Error checking policy:", policyError);
      return {
        success: false,
        hasUniqueConstraint,
        hasRlsEnabled,
        hasCorrectPolicy: false,
        details: `Error checking policy: ${policyError.message}`
      };
    }

    const hasCorrectPolicy = policyData === true;

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

// The missing testInsertResponse function used in QuizDebugger.tsx and useResponses.ts
export const testInsertResponse = async () => {
  try {
    const userId = await getUserId();

    if (!userId) {
      return {
        success: false,
        message: "Authentication required. Please log in to test response insertion.",
        details: null
      };
    }

    // Create a test response object
    const testResponse = {
      user_id: userId,
      question_id: `test_${Date.now()}`,
      response: "Test response",
      response_array: null,
      quiz_type: "test",
      score: 0
    };

    console.log("Attempting test insert with data:", testResponse);

    // Attempt to insert the test response
    const { data, error } = await fromTable('user_responses')
      .insert(testResponse)
      .select();

    if (error) {
      console.error("Test insert failed:", error);
      return {
        success: false,
        message: `Insert failed: ${error.message}`,
        details: error
      };
    }

    console.log("Test insert successful:", data);
    return {
      success: true,
      message: "Successfully inserted test response",
      details: data
    };
  } catch (error) {
    console.error("Exception in testInsertResponse:", error);
    return {
      success: false,
      message: `Exception occurred: ${error instanceof Error ? error.message : String(error)}`,
      details: error
    };
  }
};
