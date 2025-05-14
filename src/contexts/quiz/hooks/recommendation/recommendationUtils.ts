
import { Module } from '@/integrations/supabase/client';
import { supabase } from '@/integrations/supabase/client';
import { getUserId } from '@/contexts/quiz/utils/databaseHelpers';
import { ModuleSelection, Recommendation } from '../../types/recommendationTypes';
import { useToast } from '@/hooks/use-toast';
import { rateModuleUtil, getFinalSelectionsUtil } from '@/utils/recommendationUtils';

// Generate consistent module IDs 
export function getModuleId(code: string): number {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    const char = code.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Load user feedback (ratings) from database
export const loadUserFeedback = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_feedback')
      .select('module_id, rating')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Convert to Record<number, number>
    const feedback: Record<number, number> = {};
    if (data) {
      data.forEach(item => {
        feedback[item.module_id] = item.rating;
      });
    }
    
    return feedback;
  } catch (error) {
    console.error("Error loading user feedback:", error);
    return {};
  }
};

// Rate a module and save to database
export const rateModuleFunction = async (moduleId: number, rating: number) => {
  try {
    // Save rating to database
    await rateModuleUtil(moduleId, rating);
    return true;
  } catch (err) {
    console.error("Error rating module:", err);
    return false;
  }
};

// Get final selections based on user feedback
export const getFinalSelectionsFunction = async (
  userId: string,
  recommendations: Recommendation[],
  userFeedback: Record<number, number>
): Promise<[Module[], ModuleSelection[]]> => {
  try {
    const modules = await getFinalSelectionsUtil(userId, recommendations, userFeedback);
    
    if (modules.length < 5) {
      return [[], []];
    }
    
    // Convert selections to ModuleSelection format
    const formattedSelections: ModuleSelection[] = modules.map(module => ({
      module,
      reason: "Selected based on your preferences"
    }));
    
    return [modules, formattedSelections];
  } catch (err) {
    console.error("Error getting final selections:", err);
    return [[], []];
  }
};

// Convert global recommendations to the Recommendation[] format expected by other components
export const formatRecommendations = (recommendedModules: any[]): Recommendation[] => {
  return recommendedModules.map(rec => ({
    id: Math.floor(Math.random() * 10000),
    user_id: '',
    module_id: getModuleId(rec.modulecode),
    reason: "Recommended based on your major preferences",
    created_at: new Date().toISOString(),
    module: {
      id: getModuleId(rec.modulecode),
      university: rec.institution,
      course_code: rec.modulecode,
      title: rec.title,
      description: rec.description || "No description available.",
      aus_cus: 4,
      semester: "1"
    }
  }));
};
