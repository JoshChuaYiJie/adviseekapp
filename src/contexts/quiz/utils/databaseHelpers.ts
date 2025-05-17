
import { supabase } from '@/integrations/supabase/client';

// Function to validate database tables have the correct settings
export async function validateUserResponsesTable() {
  try {
    // Check if RLS is enabled
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('check_rls_enabled', { table_name: 'user_responses' });
    
    if (rlsError) throw rlsError;
    
    // Check if unique constraint exists
    const { data: uniqueData, error: uniqueError } = await supabase
      .rpc('check_unique_constraint', { 
        table_name: 'user_responses',
        column_names: ['user_id', 'question_id']
      });
      
    if (uniqueError) throw uniqueError;
    
    // Check if appropriate policy exists
    const { data: policyData, error: policyError } = await supabase
      .rpc('check_policy_exists', {
        table_name: 'user_responses',
        policy_name: 'Users can select their own responses'
      });
      
    if (policyError) throw policyError;
    
    // Return validation results
    return {
      success: rlsData && uniqueData && policyData,
      hasRlsEnabled: rlsData,
      hasUniqueConstraint: uniqueData,
      hasCorrectPolicy: policyData,
      details: `RLS: ${rlsData ? 'Enabled' : 'Disabled'}, Unique Constraint: ${uniqueData ? 'Yes' : 'No'}, Policy: ${policyData ? 'Yes' : 'No'}`
    };
  } catch (error) {
    console.error("Validation error:", error);
    return {
      success: false,
      hasRlsEnabled: false,
      hasUniqueConstraint: false,
      hasCorrectPolicy: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Function to test inserting a response
export async function testInsertResponse() {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return { success: false, message: 'Not authenticated' };
    }
    
    const testData = {
      user_id: userData.user.id,
      question_id: 'test-question',
      response: 'Test response',
      score: 5,
      quiz_type: 'test',
      component: 'test-component'
    };
    
    const { data, error } = await supabase
      .from('user_responses')
      .insert(testData)
      .select();
      
    if (error) {
      return { success: false, message: error.message };
    }
    
    return { success: true, message: 'Test insert succeeded', data };
  } catch (error) {
    return { 
      success: false, 
      message: `Error: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

// Function to inspect user responses for debugging
export async function inspectResponses(userId: string, pattern?: string) {
  if (!userId) return [];
  
  try {
    // First try the open_ended_responses table with the updated schema
    let query = supabase
      .from('open_ended_responses')
      .select('*')
      .eq('user_id', userId);
      
    if (pattern) {
      query = query.ilike('question', `%${pattern}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error querying open_ended_responses:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error inspecting responses:", error);
    throw error;
  }
}
