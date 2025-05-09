
import { createClient } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";

// Get current user ID
export const getUserId = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
};

// Calculate RIASEC profile from user responses
export const calculateRiasecProfile = async (userId: string) => {
  try {
    console.log(`Calculating RIASEC profile for user ${userId}`);
    
    // Get all responses for RIASEC-related quiz types
    const { data: responses, error } = await supabase
      .from('user_responses')
      .select('question_id, response, score, component')
      .eq('user_id', userId)
      .in('quiz_type', ['interest-part 1', 'interest-part 2', 'competence'])
      .is('component', 'not.null');
    
    if (error) {
      console.error('Error fetching RIASEC responses:', error);
      throw error;
    }

    if (!responses || responses.length === 0) {
      console.log('No RIASEC responses found');
      return { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    }

    console.log(`Found ${responses.length} RIASEC-related responses`);
    
    // Group responses by component
    const componentGroups: Record<string, { totalScore: number, count: number }> = {};
    
    responses.forEach(response => {
      if (response.component && response.score) {
        // Extract the first letter of the component and capitalize it
        const componentKey = response.component.charAt(0).toUpperCase();
        
        if (!componentGroups[componentKey]) {
          componentGroups[componentKey] = { totalScore: 0, count: 0 };
        }
        
        componentGroups[componentKey].totalScore += response.score;
        componentGroups[componentKey].count++;
        
        console.info(`Added score ${response.score} to category ${componentKey}, from question ${response.question_id}`);
      }
    });
    
    // Calculate average scores for each component
    const averageScores: Record<string, number> = {};
    let totalAverageScore = 0;
    
    Object.entries(componentGroups).forEach(([component, { totalScore, count }]) => {
      if (count > 0) {
        const averageScore = Math.round(totalScore / count);
        averageScores[component] = averageScore;
        totalAverageScore += averageScore;
      }
    });
    
    // Ensure we have entries for all RIASEC components even if they're zero
    const riasecProfile: Record<string, number> = {
      R: averageScores.R || 0,
      I: averageScores.I || 0,
      A: averageScores.A || 0,
      S: averageScores.S || 0,
      E: averageScores.E || 0,
      C: averageScores.C || 0
    };
    
    console.log('RIASEC scores calculated:', riasecProfile);
    return riasecProfile;
  } catch (error) {
    console.error('Error in calculateRiasecProfile:', error);
    return { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  }
};

// Calculate Work Values profile from user responses
export const calculateWorkValuesProfile = async (userId: string) => {
  try {
    console.log(`Calculating Work Values profile for user ${userId}`);
    
    // Get all responses for Work Values quiz type
    const { data: responses, error } = await supabase
      .from('user_responses')
      .select('question_id, response, score, component')
      .eq('user_id', userId)
      .eq('quiz_type', 'work-values')
      .is('component', 'not.null');
    
    if (error) {
      console.error('Error fetching Work Values responses:', error);
      throw error;
    }

    if (!responses || responses.length === 0) {
      console.log('No responses found for quiz type work_values');
      return {
        Achievement: 0,
        Independence: 0,
        Recognition: 0,
        Relationships: 0,
        Support: 0,
        WorkingConditions: 0
      };
    }

    console.log(`Total Work Values responses found: ${responses.length}`);
    
    // Group responses by component
    const componentGroups: Record<string, { totalScore: number, count: number }> = {};
    
    responses.forEach(response => {
      if (response.component && response.score) {
        const componentKey = response.component;
        
        if (!componentGroups[componentKey]) {
          componentGroups[componentKey] = { totalScore: 0, count: 0 };
        }
        
        componentGroups[componentKey].totalScore += response.score;
        componentGroups[componentKey].count++;
      }
    });
    
    // Calculate average scores for each component
    const averageScores: Record<string, number> = {};
    
    Object.entries(componentGroups).forEach(([component, { totalScore, count }]) => {
      if (count > 0) {
        averageScores[component] = Math.round(totalScore / count);
      }
    });
    
    // Ensure we have entries for all work values components even if they're zero
    const workValuesProfile = {
      Achievement: averageScores.Achievement || 0,
      Independence: averageScores.Independence || 0,
      Recognition: averageScores.Recognition || 0,
      Relationships: averageScores.Relationships || 0,
      Support: averageScores.Support || 0,
      WorkingConditions: averageScores['Working Conditions'] || averageScores.WorkingConditions || 0
    };
    
    console.log('Work Values scores calculated:', workValuesProfile);
    return workValuesProfile;
  } catch (error) {
    console.error('Error in calculateWorkValuesProfile:', error);
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

// For debugging purposes - inspect user responses
export const inspectResponses = async (userId: string, type?: string) => {
  try {
    let query = supabase
      .from('user_responses')
      .select('*')
      .eq('user_id', userId);
    
    if (type) {
      if (type.toLowerCase() === 'riasec') {
        query = query.in('quiz_type', ['interest-part 1', 'interest-part 2', 'competence']);
      } else if (type.toLowerCase() === 'work') {
        query = query.eq('quiz_type', 'work-values');
      } else {
        query = query.eq('quiz_type', type);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error inspecting responses:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Error in inspectResponses:', error);
    return [];
  }
};

// Test database access and permissions
export const validateUserResponsesTable = async () => {
  try {
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_responses')
      .select('id')
      .limit(1);
    
    const hasRlsEnabled = await supabase.rpc('check_rls_enabled', { table_name: 'user_responses' });
    const hasUniqueConstraint = await supabase.rpc('check_unique_constraint', { 
      table_name: 'user_responses',
      column_names: ['user_id', 'question_id']
    });
    const hasCorrectPolicy = await supabase.rpc('check_policy_exists', {
      table_name: 'user_responses',
      policy_name: 'Users can view own responses'
    });
    
    return {
      success: !tableError && hasRlsEnabled && hasUniqueConstraint,
      hasRlsEnabled,
      hasUniqueConstraint,
      hasCorrectPolicy,
      details: tableError ? tableError.message : "Table is accessible"
    };
  } catch (error) {
    console.error('Error validating user_responses table:', error);
    return {
      success: false,
      details: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

// Test insert response for debugging
export const testInsertResponse = async () => {
  try {
    const userId = await getUserId();
    
    if (!userId) {
      return {
        success: false,
        message: "Not authenticated",
        details: "User must be logged in to test"
      };
    }
    
    // Try to insert a test response
    const { data, error } = await supabase
      .from('user_responses')
      .insert({
        user_id: userId,
        question_id: 'TEST_' + Date.now(),
        response: 'Test Response',
        score: 3,
        quiz_type: 'test',
        component: 'Test'
      })
      .select();
    
    if (error) {
      return {
        success: false,
        message: `Insert failed: ${error.message}`,
        details: error
      };
    }
    
    return {
      success: true,
      message: "Successfully inserted test response",
      details: data
    };
  } catch (error) {
    return {
      success: false,
      message: "Exception occurred during test",
      details: error
    };
  }
};
