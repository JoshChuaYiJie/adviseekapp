
/**
 * Utility functions to validate database configurations like RLS policies and constraints
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Check if a table has Row Level Security (RLS) enabled
 */
export const checkRlsEnabled = async (tableName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('check_rls_enabled', {
      table_name: tableName
    });
    
    if (error) {
      console.error('Error checking RLS:', error);
      return false;
    }
    
    return data === true;
  } catch (err) {
    console.error('Exception checking RLS:', err);
    return false;
  }
};

/**
 * Check if a specific policy exists on a table
 */
export const checkPolicyExists = async (tableName: string, policyName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('check_policy_exists', {
      table_name: tableName,
      policy_name: policyName
    });
    
    if (error) {
      console.error('Error checking policy:', error);
      return false;
    }
    
    return data === true;
  } catch (err) {
    console.error('Exception checking policy:', err);
    return false;
  }
};

/**
 * Check if a table has a unique constraint on specified columns
 */
export const checkUniqueConstraint = async (
  tableName: string, 
  columns: string[]
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('check_unique_constraint', {
      table_name: tableName,
      column_names: columns
    });
    
    if (error) {
      console.error('Error checking unique constraint:', error);
      return false;
    }
    
    return data === true;
  } catch (err) {
    console.error('Exception checking constraint:', err);
    return false;
  }
};

/**
 * Check if the user_responses table is properly configured
 */
export const validateUserResponsesTable = async (): Promise<{
  success: boolean;
  hasRls: boolean;
  hasUniqueConstraint: boolean;
  hasInsertPolicy: boolean;
  hasUpdatePolicy: boolean;
  hasSelectPolicy: boolean;
  details: string;
}> => {
  try {
    const hasRls = await checkRlsEnabled('user_responses');
    const hasUniqueConstraint = await checkUniqueConstraint('user_responses', ['user_id', 'question_id']);
    const hasInsertPolicy = await checkPolicyExists('user_responses', 'Users can insert their own responses');
    const hasUpdatePolicy = await checkPolicyExists('user_responses', 'Users can update their own responses');
    const hasSelectPolicy = await checkPolicyExists('user_responses', 'Users can view their own responses');
    
    const details = [
      `RLS ${hasRls ? 'enabled' : 'disabled'}`,
      `Unique constraint ${hasUniqueConstraint ? 'exists' : 'missing'} on (user_id, question_id)`,
      `Insert policy ${hasInsertPolicy ? 'exists' : 'missing'}`,
      `Update policy ${hasUpdatePolicy ? 'exists' : 'missing'}`,
      `Select policy ${hasSelectPolicy ? 'exists' : 'missing'}`
    ].join(', ');
    
    return {
      success: hasRls && hasUniqueConstraint && hasInsertPolicy && hasUpdatePolicy && hasSelectPolicy,
      hasRls,
      hasUniqueConstraint,
      hasInsertPolicy,
      hasUpdatePolicy,
      hasSelectPolicy,
      details
    };
  } catch (err) {
    console.error('Exception validating user_responses table:', err);
    return {
      success: false,
      hasRls: false,
      hasUniqueConstraint: false,
      hasInsertPolicy: false,
      hasUpdatePolicy: false,
      hasSelectPolicy: false,
      details: `Error: ${err instanceof Error ? err.message : String(err)}`
    };
  }
};
