
import { supabase } from '@/integrations/supabase/client';

// Helper function to get current user ID
export async function getUserId(): Promise<string | null> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id || null;
    return userId;
  } catch (error) {
    console.error("Error getting user ID:", error);
    return null;
  }
}

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
    
    return { success: true, message: 'Test insert succeeded', data, details: 'Test completed successfully' };
  } catch (error) {
    return { 
      success: false, 
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      details: String(error)
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

// Function to calculate RIASEC profile from user responses
export async function calculateRiasecProfile(userId: string): Promise<Record<string, number>> {
  try {
    // Default empty profile with all RIASEC components
    const profile: Record<string, number> = {
      'Realistic': 0,
      'Investigative': 0,
      'Artistic': 0,
      'Social': 0,
      'Enterprising': 0,
      'Conventional': 0
    };
    
    // Fetch user responses with RIASEC components
    const { data, error } = await supabase
      .from('user_responses')
      .select('*')
      .eq('user_id', userId)
      .in('quiz_type', ['interest_p1', 'interest_p2', 'competence'])
      .not('component', 'is', null);
      
    if (error) {
      console.error("Error fetching RIASEC data:", error);
      return profile;
    }
    
    if (!data || data.length === 0) {
      console.log("No RIASEC data found for user");
      return profile;
    }
    
    // Process each response to build the RIASEC profile
    data.forEach(item => {
      if (item.component && typeof item.score === 'number') {
        const component = item.component as string;
        if (component in profile) {
          // Convert score to number to ensure proper addition
          const score = Number(item.score);
          if (!isNaN(score)) {
            profile[component] += score;
          }
        }
      }
    });
    
    console.log("Calculated RIASEC profile:", profile);
    return profile;
  } catch (error) {
    console.error("Error calculating RIASEC profile:", error);
    return {
      'Realistic': 0,
      'Investigative': 0,
      'Artistic': 0,
      'Social': 0,
      'Enterprising': 0,
      'Conventional': 0
    };
  }
}

// Function to calculate Work Values profile from user responses
export async function calculateWorkValuesProfile(userId: string): Promise<Record<string, number>> {
  try {
    // Default empty profile with all work value components
    const profile: Record<string, number> = {
      'Achievement': 0,
      'Independence': 0,
      'Recognition': 0,
      'Relationships': 0,
      'Support': 0,
      'Working Conditions': 0
    };
    
    // Fetch user responses with work value components
    const { data, error } = await supabase
      .from('user_responses')
      .select('*')
      .eq('user_id', userId)
      .eq('quiz_type', 'work_values')
      .not('component', 'is', null);
      
    if (error) {
      console.error("Error fetching work values data:", error);
      return profile;
    }
    
    if (!data || data.length === 0) {
      console.log("No work values data found for user");
      return profile;
    }
    
    // Process each response to build the work values profile
    data.forEach(item => {
      if (item.component && typeof item.score === 'number') {
        const component = item.component as string;
        if (component in profile) {
          // Convert score to number to ensure proper addition
          const score = Number(item.score);
          if (!isNaN(score)) {
            profile[component] += score;
          }
        }
      }
    });
    
    console.log("Calculated work values profile:", profile);
    return profile;
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
}
