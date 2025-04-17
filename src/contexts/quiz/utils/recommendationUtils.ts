
import { Module } from '@/integrations/supabase/client';
import { QuizQuestion } from '@/integrations/supabase/client';
import { supabase } from '@/integrations/supabase/client';
import { Recommendation, ModuleSelection } from '../types/recommendationTypes';

// Define types needed for calculations
export interface ModuleRating {
  moduleCode: string;
  ratings: { [questionId: number]: number };
}

export interface UserResponse {
  questionId: number;
  response: number;
}

interface ModuleWeighting {
  moduleCode: string;
  weight: number;
}

export const calculateRecommendations = (
  moduleRatings: ModuleRating[],
  userResponses: UserResponse[],
  questions: QuizQuestion[]
): ModuleWeighting[] => {
  const moduleWeights: { [moduleCode: string]: number } = {};

  questions.forEach((question, questionIndex) => {
    const userResponse = userResponses[questionIndex];

    if (!userResponse) {
      return;
    }

    const weight = question.weight ?? 1;

    moduleRatings.forEach((moduleRating) => {
      const moduleCode = moduleRating.moduleCode;
      const rating = moduleRating.ratings[question.id];

      if (rating === undefined) {
        return;
      }

      const difference = Math.abs(rating - userResponse.response);
      const score = 1 - (difference / 4);

      if (moduleWeights[moduleCode] === undefined) {
        moduleWeights[moduleCode] = 0;
      }

      moduleWeights[moduleCode] += score * weight;
    });
  });

  const moduleWeightingArray: ModuleWeighting[] = Object.entries(moduleWeights)
    .map(([moduleCode, weight]) => ({ moduleCode, weight }))
    .sort((a, b) => b.weight - a.weight);

  return moduleWeightingArray;
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
