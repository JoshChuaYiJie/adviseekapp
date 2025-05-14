

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

// Calculate RIASEC profile from user responses
export const calculateRiasecProfile = async (userId: string): Promise<Record<string, number>> => {
  try {
    console.log(`Calculating RIASEC profile for user ${userId}`);
    
    // Get all RIASEC-related responses
    const responses = await inspectResponses(userId, 'RIASEC');
    
    if (!responses || responses.length === 0) {
      console.log("No RIASEC responses found for user");
      return {};
    }
    
    // Initialize component scores
    const componentScores: Record<string, number> = {
      Realistic: 0,
      Investigative: 0,
      Artistic: 0,
      Social: 0,
      Enterprising: 0,
      Conventional: 0
    };
    
    // Process each response
    responses.forEach(response => {
      // Skip responses without component or score
      if (!response.component || response.score === null || response.score === undefined) {
        return;
      }
      
      // Make sure component is one of the RIASEC components
      const component = response.component as string;
      if (component in componentScores) {
        // Add score to component total
        componentScores[component] += Number(response.score);
      }
    });
    
    console.log('Calculated RIASEC component scores:', componentScores);
    
    // Filter out zero scores
    const filteredScores: Record<string, number> = {};
    Object.entries(componentScores).forEach(([key, value]) => {
      if (value > 0) {
        filteredScores[key] = value;
      }
    });
    
    return filteredScores;
  } catch (error) {
    console.error('Error calculating RIASEC profile:', error);
    return {};
  }
};

// Calculate Work Values profile from user responses
export const calculateWorkValuesProfile = async (userId: string): Promise<Record<string, number>> => {
  try {
    console.log(`Calculating Work Values profile for user ${userId}`);
    
    // Get all Work Values responses
    const responses = await inspectResponses(userId, 'WorkValues');
    
    if (!responses || responses.length === 0) {
      console.log("No Work Values responses found for user");
      return {};
    }
    
    // Initialize component scores
    const componentScores: Record<string, number> = {
      Achievement: 0,
      Independence: 0,
      Recognition: 0,
      Relationships: 0,
      Support: 0,
      'Working Conditions': 0,
      Altruism: 0
    };
    
    // Process each response
    responses.forEach(response => {
      // Skip responses without component or score
      if (!response.component || response.score === null || response.score === undefined) {
        return;
      }
      
      // Make sure component is one of the Work Values components
      const component = response.component as string;
      if (component in componentScores) {
        // Add score to component total
        componentScores[component] += Number(response.score);
      }
    });
    
    console.log('Calculated Work Values component scores:', componentScores);
    
    // Filter out zero scores
    const filteredScores: Record<string, number> = {};
    Object.entries(componentScores).forEach(([key, value]) => {
      if (value > 0) {
        filteredScores[key] = value;
      }
    });
    
    return filteredScores;
  } catch (error) {
    console.error('Error calculating Work Values profile:', error);
    return {};
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

