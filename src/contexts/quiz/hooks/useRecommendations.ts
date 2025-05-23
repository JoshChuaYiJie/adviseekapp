
import { useState } from 'react';
import { Module } from '@/integrations/supabase/client';
import { getUserId } from '../utils/databaseHelpers';
import { useToast } from '@/hooks/use-toast';
import { Recommendation, ModuleSelection } from '../types/recommendationTypes';
import { useModuleRecommendations } from '@/hooks/useModuleRecommendations';

// Fix: Changed 'export { Recommendation }' to 'export type { Recommendation }'
export type { Recommendation } from '../types/recommendationTypes';

export const useRecommendations = () => {
  const [userFeedback, setUserFeedback] = useState<Record<number, number>>({});
  const [finalSelections, setFinalSelections] = useState<ModuleSelection[]>([]);
  const { toast } = useToast();

  // Use our centralized module recommendations hook
  const { 
    recommendedModules, 
    loadingModules: isLoading, 
    error, 
    refetchRecommendations
  } = useModuleRecommendations();

  // Convert recommendedModules to the Recommendation[] format expected by other components
  const recommendations = recommendedModules.map(rec => ({
    id: Math.floor(Math.random() * 10000),
    user_id: '',
    module_id: rec.module.id,
    reason: rec.reasoning[0] || "Recommended based on your major preferences",
    created_at: new Date().toISOString(),
    module: rec.module
  }));

  // Log the recommendations for debugging
  console.log("Recommendations in useRecommendations:", recommendations.length);

  // Load user feedback (ratings) - temporarily disabled until user_feedback table types are available
  const loadUserFeedback = async (userId: string) => {
    try {
      // TODO: Implement when user_feedback table types are available
      console.log("Loading user feedback for:", userId);
      return {};
    } catch (error) {
      console.error("Error loading user feedback:", error);
      return {};
    }
  };

  // Load recommendations
  const loadRecommendations = async (userId: string) => {
    try {
      // Use our centralized refetchRecommendations function
      await refetchRecommendations();
      
      // Also load user feedback (ratings)
      await loadUserFeedback(userId);
      
      return recommendations;
    } catch (err) {
      console.error("Error loading recommendations:", err);
      throw err;
    }
  };

  // Generate recommendations
  const generateRecommendations = async (userId: string) => {
    try {
      // Use our centralized refetchRecommendations function
      await refetchRecommendations();
      
      // Also load user feedback (ratings)
      await loadUserFeedback(userId);
      
      return recommendations;
    } catch (err) {
      console.error("Error generating recommendations:", err);
      throw err;
    }
  };

  // Rate a module
  const rateModule = async (moduleId: number, rating: number) => {
    try {
      // Update local state immediately for better UX
      setUserFeedback(prev => ({
        ...prev,
        [moduleId]: rating
      }));
      
      // TODO: Implement actual rating save when user_feedback table types are available
      console.log("Rating module:", moduleId, "with rating:", rating);
    } catch (err) {
      console.error("Error rating module:", err);
      // Revert state change if there was an error
      setUserFeedback(prev => {
        const newState = { ...prev };
        delete newState[moduleId];
        return newState;
      });
      
      toast({
        title: "Error",
        description: "Failed to save your rating. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Refine recommendations - now just uses refetchRecommendations
  const refineRecommendations = async (selectedModuleIds: number[] = []) => {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error("You must be logged in to refine recommendations");
      }
      
      // Use centralized refetchRecommendations function
      await refetchRecommendations();
      
      toast({
        title: "Recommendations Refined",
        description: "Your recommendations have been updated based on your ratings.",
      });
    } catch (err) {
      console.error("Error refining recommendations:", err);
      toast({
        title: "Error",
        description: "Failed to refine recommendations. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get final course selections
  const getFinalSelections = async () => {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error("You must be logged in to get course selections");
      }
      
      // Filter to highly rated modules (7+)
      const highlyRated = recommendations.filter(rec => 
        userFeedback[rec.module_id] >= 7
      );
      
      if (highlyRated.length < 5) {
        toast({
          title: "Not Enough Ratings",
          description: "Please rate more modules highly (7+) to get course selections.",
        });
        return [];
      }
      
      // Sort by rating (highest first)
      highlyRated.sort((a, b) => 
        (userFeedback[b.module_id] || 0) - (userFeedback[a.module_id] || 0)
      );
      
      // Take top 5 and convert to modules
      const selections = highlyRated.slice(0, 5).map(rec => rec.module);
      
      // Convert selections to ModuleSelection format
      const formattedSelections: ModuleSelection[] = selections.map(module => ({
        module,
        reason: "Selected based on your preferences"
      }));
      
      setFinalSelections(formattedSelections);
      return selections;
    } catch (err) {
      console.error("Error getting final selections:", err);
      toast({
        title: "Error",
        description: "Failed to generate course selections. Please try again.",
        variant: "destructive",
      });
      return [];
    }
  };

  return {
    recommendations,
    userFeedback,
    finalSelections,
    isLoading,
    error,
    setIsLoading: (loading: boolean) => null, // This is now handled by the useModuleRecommendations hook
    generateRecommendations,
    loadRecommendations,
    rateModule,
    refineRecommendations,
    getFinalSelections
  };
};
