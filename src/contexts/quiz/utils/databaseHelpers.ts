import { supabase } from "@/integrations/supabase/client";
import { type Json, type Database } from "@/integrations/supabase/types";

interface ValidationResult {
  success: boolean;
  hasUniqueConstraint: boolean;
  hasRlsEnabled: boolean;
  hasCorrectPolicy: boolean;
  details: string;
}

interface UserResponse {
  user_id: string;
  question_id: string;
  response: string | null;
  response_array: string[] | null;
  quiz_type: string | null;
  score: number;
  [key: string]: any;
}

// Helper function to make Supabase queries
export function fromTable<T extends keyof Database['public']['Tables']>(tableName: T) {
  return supabase.from(tableName);
}

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

export const validateUserResponsesTable = async (): Promise<ValidationResult> => {
  try {
    // Check for RLS enabled
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('check_table_rls', {
        table_name: 'user_responses'
      } as Database['public']['Functions']['check_table_rls']['Args']);

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
      }as Database['public']['Functions']['check_unique_constraint']['Args']);

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
      }as Database['public']['Functions']['check_policy_exists']['Args']);

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