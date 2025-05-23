
import { Module, Recommendation } from "@/integrations/supabase/client";
import { getUserId } from "@/contexts/quiz/utils/databaseHelpers";

// Generate recommendations based on user responses
export const generateRecommendationsUtil = async (
  userId: string,
  modules: Module[]
): Promise<Recommendation[]> => {
  try {
    // Mock implementation that returns sample recommendations
    const recommendations: Recommendation[] = modules.slice(0, 5).map(module => ({
      id: Math.floor(Math.random() * 10000),
      user_id: userId,
      module_id: module.id,
      reason: "Recommended based on your profile",
      created_at: new Date().toISOString(),
      module
    }));
    
    return recommendations;
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return [];
  }
};

// Load user feedback (ratings) - temporarily disabled until user_feedback table types are available
export const loadUserFeedbackUtil = async (userId: string): Promise<Record<number, number>> => {
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
export const loadRecommendationsUtil = async (userId: string): Promise<Recommendation[]> => {
  try {
    // In a real implementation, we would fetch from the database
    // For now, we'll mock with sample data
    const modules = await fetchModulesMock();
    return generateRecommendationsUtil(userId, modules);
  } catch (error) {
    console.error("Error loading recommendations:", error);
    return [];
  }
};

// Rate a module - temporarily disabled until user_feedback table types are available
export const rateModuleUtil = async (moduleId: number, rating: number): Promise<void> => {
  try {
    const userId = await getUserId();
    if (!userId) {
      throw new Error("User not authenticated");
    }
    
    // TODO: Implement when user_feedback table types are available
    console.log("Rating module:", moduleId, "with rating:", rating, "for user:", userId);
  } catch (error) {
    console.error("Error rating module:", error);
    throw error;
  }
};

// Refine recommendations
export const refineRecommendationsUtil = async (
  userId: string,
  modules: Module[],
  excludeModuleIds: number[] = []
): Promise<void> => {
  // In a real implementation, this would use algorithm to refine recommendations
  console.log(`Refining recommendations for ${userId}, excluding ${excludeModuleIds.length} modules`);
};

// Get final selections
export const getFinalSelectionsUtil = async (
  userId: string, 
  recommendations: Recommendation[],
  userFeedback: Record<number, number>
): Promise<Module[]> => {
  try {
    // Filter to highly rated modules (7+)
    const highlyRated = recommendations.filter(rec => 
      userFeedback[rec.module_id] >= 7
    );
    
    // Sort by rating (highest first)
    highlyRated.sort((a, b) => 
      (userFeedback[b.module_id] || 0) - (userFeedback[a.module_id] || 0)
    );
    
    // Take top 5 or fewer
    return highlyRated.slice(0, 5).map(rec => rec.module);
  } catch (error) {
    console.error("Error getting final selections:", error);
    return [];
  }
};

// Helper function to fetch modules (mock)
export const fetchModulesMock = async (): Promise<Module[]> => {
  return [
    {
      id: 1,
      university: "NUS",
      course_code: "CS1101S",
      title: "Programming Methodology",
      aus_cus: 4,
      semester: "1",
      description: "This module introduces the concepts of programming and computational problem-solving."
    },
    {
      id: 2,
      university: "NUS",
      course_code: "CS2030",
      title: "Programming Methodology II",
      aus_cus: 4,
      semester: "1",
      description: "This module continues the introduction to programming methodology."
    }
  ] as Module[];
};
