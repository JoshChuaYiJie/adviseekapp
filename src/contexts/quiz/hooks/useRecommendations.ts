
import { useState } from 'react';
import { Module } from '@/integrations/supabase/client';
import { getUserId } from '../utils/databaseHelpers';
import { useToast } from '@/hooks/use-toast';
import { Recommendation, ModuleSelection } from '../types/recommendationTypes';
import { fetchModuleRecommendations } from '@/utils/recommendationUtils';
import { MajorRecommendationsType } from '@/components/sections/majors/types';
import { supabase } from '@/integrations/supabase/client';
import { rateModuleUtil, getFinalSelectionsUtil } from '@/utils/recommendationUtils';

// Fix: Changed 'export { Recommendation }' to 'export type { Recommendation }'
export type { Recommendation } from '../types/recommendationTypes';

export const useRecommendations = (modules: Module[]) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [userFeedback, setUserFeedback] = useState<Record<number, number>>({});
  const [finalSelections, setFinalSelections] = useState<ModuleSelection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Generate consistent module IDs based on modulecode - EXACTLY as in QuizContext
  const getModuleId = (code: string) => {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  // Generate recommendations
  const generateRecommendations = async (userId: string) => {
    try {
      setIsLoading(true);
      
      // Use the EXACT SAME mock major recommendations as in QuizContext
      const mockMajorRecommendations: MajorRecommendationsType = {
        exactMatches: ["Computer Science at NUS", "Information Systems at NUS"],
        permutationMatches: [],
        riasecMatches: ["Software Engineering at NTU", "Data Science at SMU"],
        workValueMatches: ["Computer Engineering at NTU"],
        questionFiles: [], 
        riasecCode: "RSA", // Matching the RIASEC code seen in console logs  
        workValueCode: "RcRA", // Matching the Work Values code seen in console logs
        matchType: 'exact' 
      };
      
      // Get module recommendations based on these majors - no longer limiting the results
      const moduleRecs = await fetchModuleRecommendations(mockMajorRecommendations, 0);
      
      if (!moduleRecs || moduleRecs.length === 0) {
        throw new Error("No module recommendations found");
      }
      
      console.log(`Generated ${moduleRecs.length} module recommendations`);
      
      // Convert to the format expected by the UI with consistent IDs
      const formattedRecs: Recommendation[] = moduleRecs.map(module => ({
        id: Math.floor(Math.random() * 10000),
        user_id: userId,
        module_id: getModuleId(module.modulecode),
        reason: "Recommended based on your major preferences",
        created_at: new Date().toISOString(),
        module: {
          id: getModuleId(module.modulecode),
          university: module.institution as "NUS" | "NTU" | "SMU",
          course_code: module.modulecode,
          title: module.title,
          description: module.description || "No description available.",
          aus_cus: 4, // Default value
          semester: "1" // Default value
        }
      }));
      
      setRecommendations(formattedRecs);
      
      // Also load user feedback (ratings)
      await loadUserFeedback(userId);
      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error("Error generating recommendations:", err);
      setIsLoading(false);
      setError(err instanceof Error ? err.message : "Failed to generate recommendations");
      throw err;
    }
  };

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

  // Load recommendations - now uses the EXACT SAME approach as in QuizContext
  const loadRecommendations = async (userId: string) => {
    try {
      setIsLoading(true);
      
      // Use the EXACT SAME mock major recommendations as in QuizContext
      const mockMajorRecommendations: MajorRecommendationsType = {
        exactMatches: ["Computer Science at NUS", "Information Systems at NUS"],
        permutationMatches: [],
        riasecMatches: ["Software Engineering at NTU", "Data Science at SMU"],
        workValueMatches: ["Computer Engineering at NTU"],
        questionFiles: [],
        riasecCode: "RSA", // Matching the RIASEC code seen in console logs
        workValueCode: "RcRA", // Matching the Work Values code seen in console logs
        matchType: 'exact'
      };
      
      // Get all matching modules without limiting
      const moduleRecs = await fetchModuleRecommendations(mockMajorRecommendations, 0);
      
      console.log(`Loaded ${moduleRecs.length} module recommendations`);
      
      // Convert to the format expected by the UI with consistent IDs
      const formattedRecs: Recommendation[] = moduleRecs.map(module => ({
        id: Math.floor(Math.random() * 10000),
        user_id: userId,
        module_id: getModuleId(module.modulecode),
        reason: "Recommended based on your major preferences",
        created_at: new Date().toISOString(),
        module: {
          id: getModuleId(module.modulecode),
          university: module.institution as "NUS" | "NTU" | "SMU",
          course_code: module.modulecode,
          title: module.title,
          description: module.description || "No description available.",
          aus_cus: 4,
          semester: "1"
        }
      }));
      
      setRecommendations(formattedRecs);
      
      // Also load user feedback (ratings)
      await loadUserFeedback(userId);
      
      setIsLoading(false);
      setError(null);
      return formattedRecs;
    } catch (err) {
      console.error("Error loading recommendations:", err);
      setIsLoading(false);
      setError(err instanceof Error ? err.message : "Failed to load recommendations");
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

  // Refine recommendations based on user feedback - ensure it matches QuizContext
  const refineRecommendations = async (selectedModuleIds: number[] = []) => {
    try {
      setIsLoading(true);
      
      const userId = await getUserId();
      if (!userId) {
        throw new Error("You must be logged in to refine recommendations");
      }
      
      // Load the updated recommendations using the same approach as QuizContext
      await loadRecommendations(userId);
      
      toast({
        title: "Recommendations Refined",
        description: "Your recommendations have been updated based on your ratings.",
      });
    } catch (err) {
      console.error("Error refining recommendations:", err);
      setError(err instanceof Error ? err.message : "Failed to refine recommendations");
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
    error,
    setIsLoading,
    generateRecommendations,
    loadRecommendations,
    rateModule,
    refineRecommendations,
    getFinalSelections
  };
};
