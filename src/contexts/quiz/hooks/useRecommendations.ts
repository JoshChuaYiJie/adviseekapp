
import { useState } from 'react';
import { Module } from '@/integrations/supabase/client';
import { getUserId } from '../utils/databaseHelpers';
import { Recommendation } from '../types/recommendationTypes';
import { useGlobalProfile } from '@/contexts/GlobalProfileContext';
import { formatRecommendations } from './recommendation/recommendationUtils';
import { useFeedbackManagement } from './recommendation/useFeedbackManagement';
import { useSelectionManagement } from './recommendation/useSelectionManagement';

// Fix: Changed 'export { Recommendation }' to 'export type { Recommendation }'
export type { Recommendation } from '../types/recommendationTypes';

export const useRecommendations = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Use our global profile context
  const { 
    recommendedModules, 
    isLoading: globalIsLoading, 
    error: globalError, 
    refreshProfileData
  } = useGlobalProfile();

  // Use our feedback management hook
  const { userFeedback, loadFeedback, rateModule } = useFeedbackManagement();

  // Use our selections management hook
  const { finalSelections, getFinalSelections } = useSelectionManagement();

  // Convert recommendedModules to the Recommendation[] format expected by other components
  const recommendations: Recommendation[] = formatRecommendations(recommendedModules);

  // Log the recommendations for debugging
  console.log("Recommendations in useRecommendations (from global context):", recommendations.length);

  // Load recommendations - now just returns the global recommendations
  const loadRecommendations = async (userId: string) => {
    try {
      // Also load user feedback (ratings)
      await loadFeedback(userId);
      
      return recommendations;
    } catch (err) {
      console.error("Error loading recommendations:", err);
      throw err;
    }
  };

  // Generate recommendations - now just returns the global recommendations
  const generateRecommendations = async (userId: string) => {
    try {
      // Also load user feedback (ratings)
      await loadFeedback(userId);
      
      return recommendations;
    } catch (err) {
      console.error("Error generating recommendations:", err);
      throw err;
    }
  };

  // Refine recommendations - now uses the global refresh function
  const refineRecommendations = async (selectedModuleIds: number[] = []) => {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error("You must be logged in to refine recommendations");
      }
      
      // Use global refresh function
      await refreshProfileData();
    } catch (err) {
      console.error("Error refining recommendations:", err);
      throw err;
    }
  };

  return {
    recommendations,
    userFeedback,
    finalSelections,
    isLoading: isLoading || globalIsLoading,
    error: globalError,
    setIsLoading,
    generateRecommendations,
    loadRecommendations,
    rateModule,
    refineRecommendations,
    getFinalSelections: () => getFinalSelections(recommendations, userFeedback)
  };
};
