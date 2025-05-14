

import { supabase } from "@/integrations/supabase/client";

// Get current user ID
export const getUserId = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.log("No authenticated user found");
      return null;
    }
    
    return userId;
  } catch (error) {
    console.error("Error getting user ID:", error);
    return null;
  }
};

// Test a response insert to check permissions
export const testInsertResponse = async () => {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { 
        success: false, 
        message: "No authenticated user", 
        details: null 
      };
    }
    
    const testData = {
      user_id: userId,
      question_id: 'test-question',
      response: 'test-response',
      quiz_type: 'test-quiz',
      component: 'test-component',
      score: 5
    };
    
    const { error } = await supabase
      .from('user_responses')
      .insert(testData);
      
    if (error) {
      return { 
        success: false, 
        message: `Insert failed: ${error.message}`, 
        details: error 
      };
    }
    
    return { 
      success: true, 
      message: "Test insertion successful", 
      details: null 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Exception: ${error instanceof Error ? error.message : String(error)}`, 
      details: error 
    };
  }
};

// For RIASEC profile computation
export const calculateRiasecProfile = async (userId: string): Promise<Record<string, number>> => {
  try {
    // Combine all RIASEC components from interest and competence questions
    const { data: riasecResponses, error: riasecError } = await supabase
      .from('user_responses')
      .select('component, score')
      .eq('user_id', userId)
      .in('quiz_type', ['interest-part 1', 'interest-part 2', 'competence'])
      .not('component', 'is', null);
    
    if (riasecError) {
      console.error('Error fetching RIASEC responses:', riasecError);
      return {};
    }
    
    // Calculate profile scores by adding up scores for each component
    const profile: Record<string, number> = {};
    
    if (riasecResponses && riasecResponses.length > 0) {
      riasecResponses.forEach(response => {
        if (!response.component) return;
        
        // Initialize if not exists
        if (!profile[response.component]) {
          profile[response.component] = 0;
        }
        
        // Add score
        profile[response.component] += response.score || 0;
      });
      
      console.log("Calculated RIASEC profile:", profile);
    } else {
      console.log("No RIASEC responses found");
    }
    
    return profile;
  } catch (error) {
    console.error('Error calculating RIASEC profile:', error);
    return {};
  }
};

// For Work Values profile computation
export const calculateWorkValuesProfile = async (userId: string): Promise<Record<string, number>> => {
  try {
    // Get work values responses
    const { data: workValueResponses, error: workValueError } = await supabase
      .from('user_responses')
      .select('component, score')
      .eq('user_id', userId)
      .eq('quiz_type', 'work-values')
      .not('component', 'is', null);
    
    if (workValueError) {
      console.error('Error fetching Work Values responses:', workValueError);
      return {};
    }
    
    // Calculate profile scores by adding up scores for each component
    const profile: Record<string, number> = {};
    
    if (workValueResponses && workValueResponses.length > 0) {
      workValueResponses.forEach(response => {
        if (!response.component) return;
        
        // Initialize if not exists
        if (!profile[response.component]) {
          profile[response.component] = 0;
        }
        
        // Add score
        profile[response.component] += response.score || 0;
      });
      
      console.log("Calculated Work Values profile:", profile);
    } else {
      console.log("No Work Values responses found");
    }
    
    return profile;
  } catch (error) {
    console.error('Error calculating Work Values profile:', error);
    return {};
  }
};

// Add the missing validateUserResponsesTable function
export const validateUserResponsesTable = async () => {
  try {
    // Check if RLS is enabled
    const { data: rlsData, error: rlsError } = await supabase.rpc(
      'check_rls_enabled', 
      { table_name: 'user_responses' }
    );
    
    if (rlsError) {
      console.error('Error checking RLS:', rlsError);
      return {
        success: false,
        hasRlsEnabled: false,
        hasUniqueConstraint: false,
        hasCorrectPolicy: false,
        details: `Error checking RLS: ${rlsError.message}`
      };
    }
    
    // Check if unique constraint exists
    const { data: uniqueData, error: uniqueError } = await supabase.rpc(
      'check_unique_constraint',
      { 
        table_name: 'user_responses',
        column_names: ['user_id', 'question_id'] 
      }
    );
    
    if (uniqueError) {
      console.error('Error checking unique constraint:', uniqueError);
      return {
        success: false,
        hasRlsEnabled: rlsData,
        hasUniqueConstraint: false,
        hasCorrectPolicy: false,
        details: `Error checking unique constraint: ${uniqueError.message}`
      };
    }
    
    // Check if user_id policy exists
    const { data: policyData, error: policyError } = await supabase.rpc(
      'check_policy_exists',
      {
        table_name: 'user_responses',
        policy_name: 'Users can select their own responses'
      }
    );
    
    if (policyError) {
      console.error('Error checking policy:', policyError);
      return {
        success: false,
        hasRlsEnabled: rlsData,
        hasUniqueConstraint: uniqueData,
        hasCorrectPolicy: false,
        details: `Error checking policy: ${policyError.message}`
      };
    }
    
    // Return combined results
    const allValid = rlsData && uniqueData && policyData;
    
    return {
      success: allValid,
      hasRlsEnabled: rlsData,
      hasUniqueConstraint: uniqueData,
      hasCorrectPolicy: policyData,
      details: allValid 
        ? 'Database configuration appears correct' 
        : 'One or more configuration issues detected'
    };
  } catch (error) {
    console.error('Error validating database configuration:', error);
    return {
      success: false,
      hasRlsEnabled: false,
      hasUniqueConstraint: false,
      hasCorrectPolicy: false,
      details: `Exception: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// Debugging tool to inspect responses for a user
export const inspectResponses = async (userId: string, pattern?: string) => {
  try {
    let query = supabase
      .from('user_responses')
      .select('*')
      .eq('user_id', userId);
    
    if (pattern === 'RIASEC') {
      query = query.in('quiz_type', ['interest-part 1', 'interest-part 2', 'competence']);
    } else if (pattern === 'WorkValues') {
      query = query.eq('quiz_type', 'work-values');
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error inspecting ${pattern} responses:`, error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error(`Error inspecting ${pattern} responses:`, error);
    return [];
  }
};
