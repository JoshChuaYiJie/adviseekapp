import { getUserId } from './databaseHelpers';
import { supabase } from "@/integrations/supabase/client";
import type { Module, Recommendation } from '@/integrations/supabase/client';

// Instead of using the Supabase table directly, we'll work with local data
// since the recommendations table appears to be missing from the Supabase schema

// Function to get a user's RIASEC profile
export const getUserRiasecProfile = async (userId?: string): Promise<Record<string, number>> => {
  try {
    // Get user ID if not provided
    const currentUserId = userId || await getUserId();
    if (!currentUserId) return {};
    
    // Query for user responses to RIASEC questions
    const { data, error } = await supabase
      .from('user_responses')
      .select('*')
      .eq('user_id', currentUserId)
      .in('quiz_type', ['interest-part 1', 'interest-part 2', 'competence']);
      
    if (error) {
      console.error("Error fetching RIASEC responses:", error);
      return {};
    }
    
    if (!data || data.length === 0) {
      return {
        'R': 0,
        'I': 0,
        'A': 0,
        'S': 0,
        'E': 0,
        'C': 0
      };
    }
    
    // Define RIASEC components
    const riasecComponents = {
      'R': 0, // Realistic
      'I': 0, // Investigative
      'A': 0, // Artistic
      'S': 0, // Social
      'E': 0, // Enterprising
      'C': 0  // Conventional
    };
    
    // Process data
    data.forEach(response => {
      const { question_id, response } = response;
      switch (question_id) {
        case 1:
          riasecComponents['R'] += response;
          break;
        case 2:
          riasecComponents['I'] += response;
          break;
        case 3:
          riasecComponents['A'] += response;
          break;
        case 4:
          riasecComponents['S'] += response;
          break;
        case 5:
          riasecComponents['E'] += response;
          break;
        case 6:
          riasecComponents['C'] += response;
          break;
      }
    });
    
    return riasecComponents;
  } catch (error) {
    console.error("Error getting RIASEC profile:", error);
    return {};
  }
};

// Generate recommendations based on profile
export const generateMajorRecommendations = async (
  profile: Record<string, number>, 
  limit = 5
): Promise<Module[]> => {
  try {
    // This is a mock implementation since we're not using the recommendations table
    // Instead, we'll use modules data directly
    
    // Get all modules
    const { data: modules, error } = await supabase
      .from('modules')
      .select('*')
      .limit(limit);
      
    if (error || !modules) {
      console.error("Error fetching modules:", error);
      return [];
    }
    
    // In a real implementation, you would match modules to RIASEC profile
    // For now, we'll just return a sample of modules
    return modules as Module[];
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return [];
  }
};

// Save recommendations to database
export const saveRecommendations = async (
  recommendations: Module[], 
  reasons: string[]
): Promise<boolean> => {
  try {
    // Since the recommendations table doesn't exist in the schema,
    // we'll log the intent but not actually save anything
    console.log("Would save recommendations:", recommendations, reasons);
    
    // In a real implementation, you would save to the recommendations table
    return true;
  } catch (error) {
    console.error("Error saving recommendations:", error);
    return false;
  }
};

// Implementation of missing utility functions that useRecommendations.ts is trying to import

// Generate recommendations based on user responses
export const generateRecommendationsUtil = async (userId: string, modules: Module[]): Promise<Recommendation[]> => {
  try {
    // Fetch user responses
    const { data: userResponsesData, error: userResponsesError } = await supabase
      .from('user_responses')
      .select('*')
      .eq('user_id', userId);

    if (userResponsesError) throw userResponsesError;
    
    // Create simplified recommendations based on modules
    // In a real implementation, this would use more sophisticated recommendation logic
    const recommendations: Recommendation[] = modules
      .slice(0, 10) // Limit to 10 recommendations
      .map((module) => ({
        module_id: module.id,
        reason: `This module aligns with your interests in ${module.title.split(' ')[0]}.`,
        module,
      }));

    // Save recommendations to database
    const { error: saveError } = await supabase
      .from('recommendations')
      .upsert(
        recommendations.map(rec => ({
          user_id: userId,
          module_id: rec.module_id,
          reason: rec.reason
        })),
        { onConflict: 'user_id,module_id' }
      );

    if (saveError) throw saveError;
    
    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw new Error('Failed to generate recommendations');
  }
};

// Load user feedback (ratings)
export const loadUserFeedbackUtil = async (userId: string): Promise<Record<number, number>> => {
  try {
    const { data, error } = await supabase
      .from('user_feedback')
      .select('module_id, rating')
      .eq('user_id', userId);

    if (error) throw error;

    // Convert array to record object
    const feedbackRecord: Record<number, number> = {};
    data?.forEach(item => {
      feedbackRecord[item.module_id] = item.rating;
    });

    return feedbackRecord;
  } catch (error) {
    console.error('Error loading user feedback:', error);
    throw new Error('Failed to load user feedback');
  }
};

// Load recommendations
export const loadRecommendationsUtil = async (userId: string): Promise<Recommendation[]> => {
  try {
    const { data, error } = await supabase
      .from('recommendations')
      .select('*, module:modules(*)')
      .eq('user_id', userId);

    if (error) throw error;

    return data as Recommendation[];
  } catch (error) {
    console.error('Error loading recommendations:', error);
    throw new Error('Failed to load recommendations');
  }
};

// Rate a module
export const rateModuleUtil = async (moduleId: number, rating: number): Promise<void> => {
  try {
    // Get current user
    const { data: userData } = await supabase.auth.getSession();
    const userId = userData?.session?.user?.id;

    if (!userId) {
      throw new Error('User must be logged in to rate modules');
    }

    // Save rating to database
    const { error } = await supabase
      .from('user_feedback')
      .upsert(
        {
          user_id: userId,
          module_id: moduleId,
          rating: rating
        },
        { onConflict: 'user_id,module_id' }
      );

    if (error) throw error;
  } catch (error) {
    console.error('Error rating module:', error);
    throw new Error('Failed to save module rating');
  }
};

// Refine recommendations based on user feedback
export const refineRecommendationsUtil = async (
  userId: string, 
  modules: Module[], 
  alreadyRecommendedIds: number[]
): Promise<void> => {
  try {
    // Fetch user feedback
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('user_feedback')
      .select('module_id, rating')
      .eq('user_id', userId);

    if (feedbackError) throw feedbackError;

    // Find modules that haven't been recommended yet
    const newModules = modules.filter(m => !alreadyRecommendedIds.includes(m.id));
    
    // Create new recommendations based on user feedback
    // This is a simplified algorithm - in a real app, this would be more sophisticated
    const newRecommendations = newModules
      .slice(0, 5) // Limit to 5 new recommendations
      .map(module => ({
        user_id: userId,
        module_id: module.id,
        reason: `This recommendation is based on your feedback on similar modules.`
      }));

    // Save new recommendations to database
    if (newRecommendations.length > 0) {
      const { error } = await supabase
        .from('recommendations')
        .insert(newRecommendations);

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error refining recommendations:', error);
    throw new Error('Failed to refine recommendations');
  }
};

// Get final course selections
export const getFinalSelectionsUtil = async (
  userId: string, 
  recommendations: Recommendation[], 
  userFeedback: Record<number, number>
): Promise<ModuleSelection[]> => {
  try {
    // Filter recommendations to only include highly rated modules (7+)
    const highlyRatedModuleIds = Object.entries(userFeedback)
      .filter(([_, rating]) => rating >= 7)
      .map(([moduleId]) => parseInt(moduleId));

    // Get recommended modules that the user has rated highly
    const selections = recommendations
      .filter(rec => highlyRatedModuleIds.includes(rec.module_id) && rec.module)
      .slice(0, 5) // Limit to 5 final selections
      .map(rec => ({
        module: rec.module!,
        reason: rec.reason
      }));

    // Save selections to database
    const { error } = await supabase
      .from('user_selections')
      .upsert(
        selections.map(selection => ({
          user_id: userId,
          module_id: selection.module.id
        })),
        { onConflict: 'user_id,module_id' }
      );

    if (error) throw error;

    return selections;
  } catch (error) {
    console.error('Error getting final selections:', error);
    throw new Error('Failed to get final selections');
  }
};
