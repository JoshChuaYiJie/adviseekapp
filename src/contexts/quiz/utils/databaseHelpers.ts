import { supabase, type Module } from "@/integrations/supabase/client";
import { type Json } from "@/integrations/supabase/types";

interface ValidationResult {
  success: boolean;
  hasUniqueConstraint: boolean;
  hasRlsEnabled: boolean;
  hasCorrectPolicy: boolean;
  details: string;
}

// Helper function to make Supabase queries
export function fromTable(tableName: string) {
  return supabase.from(tableName);
}

// Get current user ID helper with enhanced debugging
export const getUserId = async (): Promise<string | null> => {
  try {
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
export const validateUserResponsesTable = async (): Promise<ValidationResult> => {
  try {
    // Check for RLS enabled
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('check_table_rls', {
        table_name: 'user_responses'
      });

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
      });

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
    // Get the session first
    const { data: { session } } = await supabase.auth.getSession();
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
      question_id: "9999", // Using string type as expected by the database
      response: "This is a test response",
      quiz_type: "test",
      score: 0
    };
    
    // Correct debug logging
    console.log("Debug - Auth State:", {
      sessionExists: !!session,
      userId: userId,
      authUserId: session?.user?.id,
      testResponse: testResponse
    });

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
    const { data, error } = await supabase
      .from('user_responses')
      .select(`
        *,
        questions:question_id (
          riasec_component
        )
      `)
      .eq('user_id', userId)
      .in('quiz_type', ['interest-part 1', 'interest-part 2', 'competence']);

    if (error) throw error;

    // Initialize RIASEC components with 0
    const riasecComponents = {
      'R': 0, 'I': 0, 'A': 0, 'S': 0, 'E': 0, 'C': 0
    };

    if (!data?.length) return riasecComponents;

    // Group and process latest responses for each question
    const latestResponses = new Map();
    data.forEach(response => {
      const existing = latestResponses.get(response.question_id);
      if (!existing || new Date(response.created_at) > new Date(existing.created_at)) {
        latestResponses.set(response.question_id, response);
      }
    });

    // Calculate scores
    latestResponses.forEach(response => {
      const component = response.questions?.riasec_component;
      if (component && component in riasecComponents) {
        const score = Number(response.response) || response.score || 0;
        riasecComponents[component] += score;
      }
    });

    console.log('RIASEC Profile:', riasecComponents);
    return riasecComponents;
  } catch (error) {
    console.error("Error calculating RIASEC profile:", error);
    return { 'R': 0, 'I': 0, 'A': 0, 'S': 0, 'E': 0, 'C': 0 };
  }
};

// Calculate Work Values profile from user responses
export const calculateWorkValuesProfile = async (userId: string): Promise<Record<string, number>> => {
  try {
    const { data, error } = await supabase
      .from('user_responses')
      .select(`
        *,
        questions:question_id (
          work_value_component
        )
      `)
      .eq('user_id', userId)
      .eq('quiz_type', 'work-values');

    if (error) throw error;

    // Initialize Work Values components with 0
    const workValueComponents = {
      'Achievement': 0,
      'Independence': 0,
      'Recognition': 0,
      'Relationships': 0,
      'Support': 0,
      'Working Conditions': 0
    };

    if (!data?.length) return workValueComponents;

    // Group and process latest responses for each question
    const latestResponses = new Map();
    data.forEach(response => {
      const existing = latestResponses.get(response.question_id);
      if (!existing || new Date(response.created_at) > new Date(existing.created_at)) {
        latestResponses.set(response.question_id, response);
      }
    });

    // Calculate scores
    latestResponses.forEach(response => {
      const component = response.questions?.work_value_component;
      if (component && component in workValueComponents) {
        const score = Number(response.response) || response.score || 0;
        workValueComponents[component] += score;
      }
    });

    console.log('Work Values Profile:', workValueComponents);
    return workValueComponents;
  } catch (error) {
    console.error("Error calculating work values profile:", error);
    return {
      'Achievement': 0,
      'Independence': 0,
      'Recognition': 0,
      'Relationships': 0,
      'Support': 0,
      'Working Conditions': 0
    };
  }
};
