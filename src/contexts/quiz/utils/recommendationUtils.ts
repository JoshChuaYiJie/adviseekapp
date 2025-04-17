
import { Module } from '@/integrations/supabase/client';
import { fromTable, getUserId } from './databaseHelpers';
import { FeedbackItem, Recommendation } from '../types/recommendationTypes';

// Generate recommendations
export const generateRecommendationsUtil = async (userId: string, modules: Module[]) => {
  if (modules.length === 0) {
    throw new Error("No modules available");
  }
  
  // Get 30 random modules or all if less than 30
  const randomModules = [...modules]
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.min(30, modules.length));
  
  // Create recommendations
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
  
  return await loadRecommendationsUtil(userId);
};

// Load user feedback (ratings)
export const loadUserFeedbackUtil = async (userId: string) => {
  const { data, error } = await fromTable('user_feedback')
    .select('module_id, rating')
    .eq('user_id', userId);
  
  if (error) {
    throw new Error(`Failed to load ratings: ${error.message}`);
  }
  
  const feedbackObj: Record<number, number> = {};
  
  if (data && Array.isArray(data)) {
    // Use type guard to ensure we're dealing with proper data
    data.forEach((item: any) => {
      if (item && typeof item.module_id === 'number' && typeof item.rating === 'number') {
        feedbackObj[item.module_id] = item.rating;
      }
    });
  }
  
  return feedbackObj;
};

// Load recommendations
export const loadRecommendationsUtil = async (userId: string): Promise<Recommendation[]> => {
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
  
  if (!data) return [];
  
  return data.map((rec: any) => ({
    module_id: rec.module_id,
    reason: rec.reason,
    module: rec.modules
  })) as Recommendation[];
};

// Rate a module
export const rateModuleUtil = async (moduleId: number, rating: number) => {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("You must be logged in to rate modules");
  }
  
  // Save rating to database
  const { error } = await fromTable('user_feedback')
    .upsert({
      user_id: userId,
      module_id: moduleId,
      rating: rating
    });
  
  if (error) {
    throw new Error(`Failed to save rating: ${error.message}`);
  }
};

// Refine recommendations
export const refineRecommendationsUtil = async (userId: string, modules: Module[], alreadyRecommendedIds: number[]) => {
  // Get modules that haven't been recommended yet
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
};

// Get final course selections
export const getFinalSelectionsUtil = async (userId: string, recommendations: Recommendation[], userFeedback: Record<number, number>) => {
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
  return selections.map(rec => ({
    module: rec.module!,
    reason: rec.reason
  }));
};
