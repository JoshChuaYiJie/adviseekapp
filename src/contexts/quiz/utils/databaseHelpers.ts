
import { supabase } from '@/integrations/supabase/client';

// Get current user ID from authentication
export const getUserId = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

// Inspect responses for a user (filtered by pattern)
export const inspectResponses = async (userId: string, pattern?: 'RIASEC' | 'WorkValues' | 'All') => {
  try {
    console.log(`Inspecting responses for user ${userId}, pattern ${pattern || 'All'}`);
    
    let query = supabase
      .from('user_responses')
      .select('*')
      .eq('user_id', userId);
      
    if (pattern === 'RIASEC') {
      // Only get responses from RIASEC-related quiz types
      query = query.in('quiz_type', ['interest-part 1', 'interest-part 2', 'competence']);
    } else if (pattern === 'WorkValues') {
      // Only get responses from Work Values quizzes
      query = query.eq('quiz_type', 'work-values');
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error inspecting responses:', error);
    throw error;
  }
};

// Test inserting a response to validate permissions
export const testInsertResponse = async () => {
  try {
    const userId = await getUserId();
    
    if (!userId) {
      return {
        success: false,
        message: 'No user authenticated',
        details: null
      };
    }
    
    // Create test data
    const testData = {
      user_id: userId,
      question_id: 'test-question',
      response: 'Test response',
      quiz_type: 'test',
      score: 0
    };
    
    // Try inserting
    const { error } = await supabase
      .from('user_responses')
      .insert(testData);
      
    if (error) {
      return {
        success: false,
        message: `Failed to insert: ${error.message}`,
        details: error
      };
    }
    
    // Clean up test data
    const { error: deleteError } = await supabase
      .from('user_responses')
      .delete()
      .eq('user_id', userId)
      .eq('question_id', 'test-question');
      
    return {
      success: true,
      message: 'Successfully inserted and deleted test response',
      details: deleteError ? `Warning: cleanup failed: ${deleteError.message}` : 'Cleanup successful'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error
    };
  }
};

// Function to validate user_responses table setup
export const validateUserResponsesTable = async () => {
  try {
    // Check if the user_responses table exists and has the proper RLS setup
    const { data: hasRlsEnabled } = await supabase.rpc('check_rls_enabled', { 
      table_name: 'user_responses' 
    });
    
    // Check if there's a unique constraint on user_id + question_id
    const { data: hasUniqueConstraint } = await supabase.rpc('check_unique_constraint', {
      table_name: 'user_responses',
      column_names: ['user_id', 'question_id']
    });
    
    // Check if there's an RLS policy for users to read their own responses
    const { data: hasCorrectPolicy } = await supabase.rpc('check_policy_exists', {
      table_name: 'user_responses',
      policy_name: 'Users can read own'
    });
    
    const results = {
      success: Boolean(hasRlsEnabled && hasUniqueConstraint && hasCorrectPolicy),
      hasRlsEnabled: Boolean(hasRlsEnabled),
      hasUniqueConstraint: Boolean(hasUniqueConstraint),
      hasCorrectPolicy: Boolean(hasCorrectPolicy),
      details: `RLS Enabled: ${hasRlsEnabled ? 'Yes' : 'No'}, ` +
               `Unique constraint: ${hasUniqueConstraint ? 'Yes' : 'No'}, ` +
               `Has correct policy: ${hasCorrectPolicy ? 'Yes' : 'No'}`
    };
    
    return results;
  } catch (error) {
    console.error('Error validating user_responses table:', error);
    return {
      success: false,
      details: error instanceof Error ? error.message : 'Unknown error validating database'
    };
  }
};
