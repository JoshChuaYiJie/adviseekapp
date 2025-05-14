
import { useState } from 'react';
import { Module } from '@/integrations/supabase/client';
import { getUserId } from '../utils/databaseHelpers';
import { useToast } from '@/hooks/use-toast';
import { Recommendation, ModuleSelection } from '../types/recommendationTypes';
import { supabase } from '@/integrations/supabase/client';
import { rateModuleUtil, getFinalSelectionsUtil } from '@/utils/recommendationUtils';
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

  // Load user feedback (ratings)
  const loadUserFeedback = async (userId: string) => {
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
      
      setUserFeedback(feedback);
      return feedback;
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
      
      // Save rating to database
      await rateModuleUtil(moduleId, rating);
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
      
      const selections = await getFinalSelectionsUtil(userId, recommendations, userFeedback);
      
      if (selections.length < 5) {
        toast({
          title: "Not Enough Ratings",
          description: "Please rate more modules highly (7+) to get course selections.",
        });
        return [];
      }
      
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
