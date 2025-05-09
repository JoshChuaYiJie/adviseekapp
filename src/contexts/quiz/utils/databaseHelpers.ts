import { supabase, type Module, type RpcParams } from "@/integrations/supabase/client";
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
    const params1: RpcParams = { table_name: 'user_responses' };
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('check_table_rls', params1);

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
    const params2: RpcParams = { 
      table_name: 'user_responses',
      column_names: ['user_id', 'question_id']
    };
    const { data: constraintData, error: constraintError } = await supabase
      .rpc('check_unique_constraint', params2);

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
    const params3: RpcParams = {
      table_name: 'user_responses',
      policy_name: 'Users can insert their own responses'
    };
    const { data: policyData, error: policyError } = await supabase
      .rpc('check_policy_exists', params3);
      
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
    // Modified to use string interpolation for the query instead of problematic .in() function
    // This gets responses for interest and competence quizzes
    const { data, error } = await supabase
      .from('user_responses')
      .select('*, question_id')
      .eq('user_id', userId)
      .or('quiz_type.eq.interest-part 1,quiz_type.eq.interest-part 2,quiz_type.eq.competence');

    if (error) {
      console.error("Error querying user_responses:", error);
      throw error;
    }

    // Initialize RIASEC components with 0
    const riasecComponents = {
      'R': 0, 'I': 0, 'A': 0, 'S': 0, 'E': 0, 'C': 0
    };

    if (!data?.length) {
      console.log("No RIASEC data found for user");
      return riasecComponents;
    }

    console.log(`Found ${data.length} RIASEC responses for user ${userId}`);

    // Process responses by manually assigning scores based on question_id
    // Map question IDs to RIASEC components based on your schema
    // This is a simplified example - adapt to your actual data structure
    data.forEach(response => {
      // Get the question ID and determine which RIASEC component it belongs to
      // This is a placeholder - you'll need to implement your actual mapping logic
      const questionId = response.question_id;
      
      // Example mapping logic (replace with your actual logic)
      let component = null;
      
      // Assign component based on question_id ranges or other logic
      // Example: questions 1-10 are "R", 11-20 are "I", etc.
      const qId = parseInt(questionId);
      if (qId >= 1 && qId <= 10) component = 'R';
      else if (qId >= 11 && qId <= 20) component = 'I';
      else if (qId >= 21 && qId <= 30) component = 'A';
      else if (qId >= 31 && qId <= 40) component = 'S';
      else if (qId >= 41 && qId <= 50) component = 'E';
      else if (qId >= 51 && qId <= 60) component = 'C';
      
      if (component && component in riasecComponents) {
        // Get the score from either response or score field
        const score = response.score || 
                     (response.response && !isNaN(Number(response.response)) ? 
                      Number(response.response) : 0);
        
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
    // Modified to use direct query without the join that was causing issues
    const { data, error } = await supabase
      .from('user_responses')
      .select('*, question_id')
      .eq('user_id', userId)
      .eq('quiz_type', 'work-values');

    if (error) {
      console.error("Error querying work values responses:", error);
      throw error;
    }

    // Initialize Work Values components with 0
    const workValueComponents = {
      'Achievement': 0,
      'Independence': 0,
      'Recognition': 0,
      'Relationships': 0,
      'Support': 0,
      'Working Conditions': 0
    };

    if (!data?.length) {
      console.log("No work values data found for user");
      return workValueComponents;
    }

    console.log(`Found ${data.length} work values responses for user ${userId}`);

    // Process responses by manually assigning scores based on question_id
    // Map question IDs to work value components based on your schema
    data.forEach(response => {
      // Get the question ID and determine which work value component it belongs to
      const questionId = parseInt(response.question_id);
      
      // Example mapping logic (replace with your actual logic)
      let component = null;
      
      // Assign component based on question_id ranges or other logic
      // Example mapping
      if (questionId >= 101 && questionId <= 110) component = 'Achievement';
      else if (questionId >= 111 && questionId <= 120) component = 'Independence';
      else if (questionId >= 121 && questionId <= 130) component = 'Recognition';
      else if (questionId >= 131 && questionId <= 140) component = 'Relationships';
      else if (questionId >= 141 && questionId <= 150) component = 'Support';
      else if (questionId >= 151 && questionId <= 160) component = 'Working Conditions';
      
      if (component && component in workValueComponents) {
        // Get the score from either response or score field
        const score = response.score || 
                     (response.response && !isNaN(Number(response.response)) ? 
                      Number(response.response) : 0);
        
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
