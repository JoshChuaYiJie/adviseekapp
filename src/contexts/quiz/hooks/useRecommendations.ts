
import { useState } from 'react';
import { Module } from '@/integrations/supabase/client';
import { fromTable, getUserId } from '../utils/databaseHelpers';
import { useToast } from '@/hooks/use-toast';

export interface Recommendation {
  module_id: number;
  reason: string;
  module?: Module;
}

export const useRecommendations = (modules: Module[]) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [userFeedback, setUserFeedback] = useState<Record<number, number>>({});
  const [finalSelections, setFinalSelections] = useState<{module: Module, reason: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Generate recommendations
  const generateRecommendations = async (userId: string) => {
    try {
      // This is where you would call your AI service
      // For now, we'll just pick 30 random modules
      if (modules.length === 0) {
        throw new Error("No modules available");
      }
      
      // Get 30 random modules or all if less than 30
      const randomModules = [...modules]
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(30, modules.length));
      
      // Create mock recommendations
      const mockRecommendations = randomModules.map(module => ({
        user_id: userId,
        module_id: module.id,
        reason: `This ${module.university} module matches your interests and academic requirements.`
      }));
      
      // Save recommendations to database
      const { error: recError } = await fromTable('recommendations')
        .insert(mockRecommendations);
      
      if (recError) {
        throw new Error(`Failed to save recommendations: ${recError.message}`);
      }
      
      // Load recommendations with module details
      await loadRecommendations(userId);
    } catch (err) {
      console.error("Error generating recommendations:", err);
      throw err;
    }
  };

  // Load user feedback (ratings)
  const loadUserFeedback = async (userId: string) => {
    try {
      // Define explicit type for feedback items
      interface FeedbackItem { module_id: number; rating: number }
      
      const { data, error } = await fromTable('user_feedback')
        .select('module_id, rating')
        .eq('user_id', userId);
      
      if (error) {
        throw new Error(`Failed to load ratings: ${error.message}`);
      }
      
      // Convert array to object mapping moduleId -> rating
      const feedbackObj: Record<number, number> = {};
      if (data) {
        // Cast data to the correct type with explicit type assertion
        const typedData = data as unknown as FeedbackItem[];
        typedData.forEach(item => {
          feedbackObj[item.module_id] = item.rating;
        });
      }
      
      setUserFeedback(feedbackObj);
    } catch (err) {
      console.error("Error loading user feedback:", err);
      // Non-fatal error, don't update error state
    }
  };

  // Load recommendations
  const loadRecommendations = async (userId: string) => {
    try {
      const { data, error } = await fromTable('recommendations')
        .select(`
          id,
          user_id,
          module_id,
          reason,
          created_at,
          modules:module_id(id, university, course_code, title, aus_cus, semester, description)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Failed to load recommendations: ${error.message}`);
      }
      
      // Transform data to match our format with explicit typing
      const formattedRecs = data ? (data as any[]).map((rec: any) => ({
        module_id: rec.module_id,
        reason: rec.reason,
        module: rec.modules as Module
      })) : [];
      
      setRecommendations(formattedRecs);
      
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
      const userId = await getUserId();
      if (!userId) {
        throw new Error("You must be logged in to rate modules");
      }
      
      // Update local state immediately for better UX
      setUserFeedback(prev => ({
        ...prev,
        [moduleId]: rating
      }));
      
      // Save rating to database
      const { error } = await fromTable('user_feedback')
        .upsert({
          user_id: userId,
          module_id: moduleId,
          rating: rating
        });
      
      if (error) {
        // Revert state change if there was an error
        setUserFeedback(prev => {
          const newState = { ...prev };
          delete newState[moduleId];
          return newState;
        });
        throw new Error(`Failed to save rating: ${error.message}`);
      }
    } catch (err) {
      console.error("Error rating module:", err);
      toast({
        title: "Error",
        description: "Failed to save your rating. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Refine recommendations based on user feedback
  const refineRecommendations = async () => {
    try {
      setIsLoading(true);
      
      const userId = await getUserId();
      if (!userId) {
        throw new Error("You must be logged in to refine recommendations");
      }
      
      // In a real implementation, this would send the ratings to your AI service
      // For now, we'll just pick 30 random modules that might include some higher-rated ones
      
      // Get modules that haven't been recommended yet
      const alreadyRecommendedIds = recommendations.map(rec => rec.module_id);
      const unusedModules = modules.filter(mod => !alreadyRecommendedIds.includes(mod.id));
      
      // Pick some random modules (or all if less than 20)
      const randomCount = Math.min(20, unusedModules.length);
      const randomModules = unusedModules
        .sort(() => 0.5 - Math.random())
        .slice(0, randomCount);
      
      // Create new recommendations
      const newRecommendations = randomModules.map(module => ({
        user_id: userId,
        module_id: module.id,
        reason: `This refined recommendation is based on your module ratings and preferences.`
      }));
      
      // Save recommendations to database
      const { error: recError } = await fromTable('recommendations')
        .insert(newRecommendations);
      
      if (recError) {
        throw new Error(`Failed to save refined recommendations: ${recError.message}`);
      }
      
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
      
      // Select modules with highest ratings
      // In a real implementation, this would consider more factors
      
      // Get modules with ratings
      const ratedModuleIds = Object.keys(userFeedback).map(Number);
      const ratedModules = recommendations.filter(rec => 
        ratedModuleIds.includes(rec.module_id) && userFeedback[rec.module_id] >= 7
      );
      
      // Sort by rating (highest first)
      ratedModules.sort((a, b) => 
        (userFeedback[b.module_id] || 0) - (userFeedback[a.module_id] || 0)
      );
      
      // Take top 5-10 modules
      const selections = ratedModules.slice(0, Math.min(10, ratedModules.length));
      
      if (selections.length < 5) {
        toast({
          title: "Not Enough Ratings",
          description: "Please rate more modules highly (7+) to get course selections.",
        });
        return [];
      }
      
      // Save selections to database
      const selectionsForDb = selections.map(rec => ({
        user_id: userId,
        module_id: rec.module_id
      }));
      
      // Clear existing selections first
      await fromTable('user_selections')
        .delete()
        .eq('user_id', userId);
      
      // Insert new selections
      const { error } = await fromTable('user_selections')
        .insert(selectionsForDb);
      
      if (error) {
        throw new Error(`Failed to save selections: ${error.message}`);
      }
      
      // Format for return
      const formattedSelections = selections.map(rec => ({
        module: rec.module!,
        reason: rec.reason
      }));
      
      setFinalSelections(formattedSelections);
      return formattedSelections;
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
