import { useState } from 'react';
import { Module } from '@/integrations/supabase/client';
import { getUserId } from '../utils/databaseHelpers';
import { useToast } from '@/hooks/use-toast';
import { Recommendation, ModuleSelection } from '../types/recommendationTypes';
import {
  generateRecommendationsUtil,
  loadUserFeedbackUtil,
  loadRecommendationsUtil,
  rateModuleUtil,
  refineRecommendationsUtil,
  getFinalSelectionsUtil
} from '@/utils/recommendationUtils';

// Fix: Changed 'export { Recommendation }' to 'export type { Recommendation }'
export type { Recommendation } from '../types/recommendationTypes';

export const useRecommendations = (modules: Module[]) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [userFeedback, setUserFeedback] = useState<Record<number, number>>({});
  const [finalSelections, setFinalSelections] = useState<ModuleSelection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Generate recommendations
  const generateRecommendations = async (userId: string) => {
    try {
      const recs = await generateRecommendationsUtil(userId, modules);
      // Explicitly cast to ensure type compatibility with state
      setRecommendations(recs as unknown as Recommendation[]);
      
      // Also load user feedback (ratings)
      await loadUserFeedback(userId);
    } catch (err) {
      console.error("Error generating recommendations:", err);
      throw err;
    }
  };

  // Load user feedback (ratings)
  const loadUserFeedback = async (userId: string) => {
    try {
      const feedback = await loadUserFeedbackUtil(userId);
      setUserFeedback(feedback);
    } catch (err) {
      console.error("Error loading user feedback:", err);
      // Non-fatal error, don't update error state
    }
  };

  // Load recommendations
  const loadRecommendations = async (userId: string) => {
    try {
      const recs = await loadRecommendationsUtil(userId);
      // Explicitly cast to ensure type compatibility with state
      setRecommendations(recs as unknown as Recommendation[]);
      
      // Also load user feedback (ratings)
      await loadUserFeedback(userId);
    } catch (err) {
      console.error("Error loading recommendations:", err);
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

  // Refine recommendations based on user feedback
  const refineRecommendations = async (selectedModuleIds: number[] = []) => {
    try {
      setIsLoading(true);
      
      const userId = await getUserId();
      if (!userId) {
        throw new Error("You must be logged in to refine recommendations");
      }
      
      // Get IDs of already recommended modules
      const alreadyRecommendedIds = recommendations.map(rec => rec.module_id);
      
      // Refine recommendations
      await refineRecommendationsUtil(userId, modules, alreadyRecommendedIds);
      
      // Load the updated recommendations
      await loadRecommendations(userId);
      
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
    } finally {
      setIsLoading(false);
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
    setIsLoading,
    generateRecommendations,
    loadRecommendations,
    rateModule,
    refineRecommendations,
    getFinalSelections
  };
};
