import { supabase } from "@/integrations/supabase/client";
import { type Json } from "@/integrations/supabase/types";

// Define the type for validation result
interface ValidationResult {
  success: boolean;
  hasUniqueConstraint: boolean;
  hasRlsEnabled: boolean;
  hasCorrectPolicy: boolean;
  details: string;
}

// Define the type for user response
interface UserResponse {
  user_id: string;
  question_id: string;
  response: string | null;
  response_array: string[] | null;
  quiz_type: string | null;
  score: number;
  [key: string]: any;
}

// Define RIASEC score types
type RiasecScores = {
  R: number; // Realistic
  I: number; // Investigative
  A: number; // Artistic
  S: number; // Social
  E: number; // Enterprising
  C: number; // Conventional
};

// Define Work Values score types
type WorkValuesScores = {
  Achievement: number;
  Independence: number;
  Recognition: number;
  Relationships: number;
  Support: number;
  WorkingConditions: number;
};

// Define RPC parameter types
type CheckTableRlsParams = { table_name: string };
type CheckUniqueConstraintParams = { table_name: string; column_names: string[] };
type CheckPolicyExistsParams = { table_name: string; policy_name: string };

// Helper function to safely make Supabase queries with dynamic table names
export function fromTable(tableName: string) {
  // Using type assertion to allow dynamic table names
  return supabase.from(tableName as any);
}

export const getUserId = async (): Promise<string | null> => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Error getting session:", sessionError);
      return null;
    }
    
    if (!session) {
      console.log("No active session found - user is not authenticated");
      return null;
    }
    
    return session.user?.id || null;
  } catch (error) {
    console.error("Exception in getUserId:", error);
    return null;
  }
};

export const calculateRiasecProfile = async (userId: string): Promise<RiasecScores> => {
  try {
    console.log("Calculating RIASEC profile for user:", userId);
    
    // Query all quiz types that could contain RIASEC data
    const quizTypes = ['interest-part 1', 'interest-part 2', 'competence'];
    let allResponses: any[] = [];
    
    // Fetch data for all relevant quiz types
    for (const quizType of quizTypes) {
      console.log(`Fetching responses for quiz type: ${quizType}`);
      const { data, error } = await fromTable('user_responses')
        .select('question_id, response, score')
        .eq('user_id', userId)
        .eq('quiz_type', quizType);

      if (error) {
        console.error(`Error fetching RIASEC responses for ${quizType}:`, error);
      } else if (data && data.length > 0) {
        console.log(`Found ${data.length} responses for quiz type ${quizType}`);
        allResponses = [...allResponses, ...data];
      } else {
        console.log(`No responses found for quiz type ${quizType}`);
      }
    }

    console.log(`Total RIASEC responses found: ${allResponses.length}`);
    
    if (allResponses.length === 0) {
      console.log("No RIASEC data found, sample quiz data to check:", await sampleUserResponses(userId));
    }

    const riasecScores: RiasecScores = {
      R: 0, I: 0, A: 0, S: 0, E: 0, C: 0
    };

    // Process all responses FLAG OUT
    allResponses.forEach((response: any) => {
      if (response && response.question_id) {
        let category = null;
        
        // Match various possible RIASEC question_id formats
        if (response.question_id.startsWith('RIASEC_')) {
          category = response.question_id.split('_')[1][0];
        } else if (response.question_id.match(/^[RIASEC]\d+$/)) {
          category = response.question_id[0]; // Format like "R1", "I2", etc.
        } else if (response.question_id.includes('_R_') || response.question_id.includes('_I_') ||
                  response.question_id.includes('_A_') || response.question_id.includes('_S_') ||
                  response.question_id.includes('_E_') || response.question_id.includes('_C_')) {
          // Format like "quiz_R_1", "interest_I_2", etc.
          const match = response.question_id.match(/_([RIASEC])_/);
          if (match) {
            category = match[1];
          }
        }
        
        if (category && category in riasecScores) {
          const scoreValue = Number(response.score || (response.response ? parseInt(response.response) : 0));
          riasecScores[category as keyof RiasecScores] += scoreValue;
          console.log(`Added score ${scoreValue} to category ${category}, from question ${response.question_id}`);
        }
      }
    });

    // Log the final scores
    console.log("RIASEC scores calculated:", riasecScores);
    return riasecScores;
  } catch (error) {
    console.error("Error calculating RIASEC profile:", error);
    return { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  }
};

export const calculateWorkValuesProfile = async (userId: string): Promise<WorkValuesScores> => {
  try {
    console.log("Calculating Work Values profile for user:", userId);
    
    // Query different potential quiz types for work values
    const quizTypes = ['work-values', 'work-value', 'values', 'work_values'];
    let allResponses: any[] = [];
    
    // Fetch data for all relevant quiz types
    for (const quizType of quizTypes) {
      console.log(`Fetching responses for quiz type: ${quizType}`);
      const { data, error } = await fromTable('user_responses')
        .select('question_id, response, score')
        .eq('user_id', userId)
        .eq('quiz_type', quizType);

      if (error) {
        console.error(`Error fetching Work Values responses for ${quizType}:`, error);
      } else if (data && data.length > 0) {
        console.log(`Found ${data.length} responses for quiz type ${quizType}`);
        allResponses = [...allResponses, ...data];
      } else {
        console.log(`No responses found for quiz type ${quizType}`);
      }
    }
    
    console.log(`Total Work Values responses found: ${allResponses.length}`);
    
    if (allResponses.length === 0) {
      // If no work values found, check if any responses exist at all
      if (!await sampleUserResponses(userId)) {
        console.log("No quiz responses found for this user at all.");
      }
    }

    const workValuesScores: WorkValuesScores = {
      Achievement: 0,
      Independence: 0,
      Recognition: 0,
      Relationships: 0,
      Support: 0,
      WorkingConditions: 0
    };

    // Process all responses
    allResponses.forEach((response: any) => {
      if (response && response.question_id) {
        let category = null;
        
        // Match various possible Work Values question_id formats
        if (response.question_id.startsWith('WV_')) {
          category = response.question_id.split('_')[1];
        } else if (response.question_id.startsWith('WorkValues_')) {
          category = response.question_id.split('_')[1];
        } else if (response.question_id.startsWith('Achievement') || 
                  response.question_id.startsWith('Independence') || 
                  response.question_id.startsWith('Recognition') || 
                  response.question_id.startsWith('Relationships') || 
                  response.question_id.startsWith('Support') || 
                  response.question_id.includes('WorkingConditions')) {
          // Format starts with the category name
          const valueTitles = Object.keys(workValuesScores);
          for (const title of valueTitles) {
            if (response.question_id.includes(title)) {
              category = title;
              break;
            }
          }
        }
        
        if (category && category in workValuesScores) {
          const scoreValue = Number(response.score || (response.response ? parseInt(response.response) : 0));
          workValuesScores[category as keyof WorkValuesScores] += scoreValue;
          console.log(`Added score ${scoreValue} to category ${category}, from question ${response.question_id}`);
        }
      }
    });

    // Log the final scores
    console.log("Work Values scores calculated:", workValuesScores);
    return workValuesScores;
  } catch (error) {
    console.error("Error calculating Work Values profile:", error);
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

// Helper function to check if any responses exist
async function sampleUserResponses(userId: string) {
  try {
    // Query any responses regardless of quiz type
    const { data, error } = await fromTable('user_responses')
      .select('question_id, response, score, quiz_type')
      .eq('user_id', userId)
      .limit(10);
      
    if (error) {
      console.error("Error fetching sample responses:", error);
      return null;
    }
    
    console.log(`Found ${data?.length || 0} sample responses:`, data);
    return data;
  } catch (error) {
    console.error("Error in sampleUserResponses:", error);
    return null;
  }
}

// Additional function to inspect a response with full details
export const inspectResponses = async (userId: string, questionPattern?: string): Promise<any[]> => {
  try {
    console.log(`Inspecting responses for user ${userId}${questionPattern ? ` with pattern ${questionPattern}` : ''}`);
    
    let query = fromTable('user_responses')
      .select('*')
      .eq('user_id', userId);
      
    if (questionPattern) {
      query = query.ilike('question_id', `%${questionPattern}%`);
    }
    
    const { data, error } = await query;
      
    if (error) {
      console.error("Error inspecting responses:", error);
      return [];
    }
    
    console.log(`Found ${data?.length || 0} responses:`, data);
    return data || [];
  } catch (error) {
    console.error("Error in inspectResponses:", error);
    return [];
  }
};

export const validateUserResponsesTable = async (): Promise<ValidationResult> => {
  try {
    // Check for RLS enabled
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('check_rls_enabled', {
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

// The missing testInsertResponse function used in QuizDebugger.tsx and useResponses.ts
export const testInsertResponse = async () => {
  try {
    const userId = await getUserId();

    if (!userId) {
      return {
        success: false,
        message: "Authentication required. Please log in to test response insertion.",
        details: null
      };
    }

    // Create a test response object
    const testResponse = {
      user_id: userId,
      question_id: `test_${Date.now()}`,
      response: "Test response",
      response_array: null,
      quiz_type: "test",
      score: 0
    };

    console.log("Attempting test insert with data:", testResponse);

    // Attempt to insert the test response
    const { data, error } = await fromTable('user_responses')
      .insert(testResponse)
      .select();

    if (error) {
      console.error("Test insert failed:", error);
      return {
        success: false,
        message: `Insert failed: ${error.message}`,
        details: error
      };
    }

    console.log("Test insert successful:", data);
    return {
      success: true,
      message: "Successfully inserted test response",
      details: data
    };
  } catch (error) {
    console.error("Exception in testInsertResponse:", error);
    return {
      success: false,
      message: `Exception occurred: ${error instanceof Error ? error.message : String(error)}`,
      details: error
    };
  }
};
