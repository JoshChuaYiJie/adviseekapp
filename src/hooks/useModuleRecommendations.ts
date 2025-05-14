
import { useState, useEffect } from 'react';
import { fetchModuleRecommendations } from '@/utils/recommendation/moduleRecommendationUtils';
import { MajorRecommendationsType } from '@/components/sections/majors/types';
import { Module } from '@/integrations/supabase/client';

export interface RecommendedModule {
  module: Module;
  reasoning: string[];
}

// Create a singleton instance to share data across the application
let sharedRecommendedModules: RecommendedModule[] = [];
let sharedLoadingState = false;
let sharedError: string | null = null;
let fetchPromise: Promise<any> | null = null;

export const useModuleRecommendations = () => {
  const [recommendedModules, setRecommendedModules] = useState<RecommendedModule[]>(sharedRecommendedModules);
  const [loadingModules, setLoadingModules] = useState(sharedLoadingState);
  const [error, setError] = useState<string | null>(sharedError);

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

  // Function to fetch module recommendations - now using shared state
  const fetchRecommendations = async () => {
    // If already fetching or have results, don't refetch
    if (fetchPromise) {
      return fetchPromise;
    }
    
    try {
      sharedLoadingState = true;
      setLoadingModules(true);
      sharedError = null;
      setError(null);
      
      // Use the EXACT SAME mock major recommendations as in QuizContext
      const mockMajorRecommendations: MajorRecommendationsType = {
        exactMatches: ["Computer Science at NUS", "Information Systems at NUS"],
        permutationMatches: [],
        riasecMatches: ["Software Engineering at NTU", "Data Science at SMU"],
        workValueMatches: ["Computer Engineering at NTU"],
        questionFiles: [],
        riasecCode: "RSA", 
        workValueCode: "RcRA", 
        matchType: 'exact'
      };
      
      // Use this as our fetch promise to avoid duplicate fetches
      fetchPromise = fetchModuleRecommendations(mockMajorRecommendations, 0);
      
      // Get module recommendations based on these majors without limiting results
      const moduleRecs = await fetchPromise;
      
      // Format the modules with IDs consistent with QuizContext
      const formattedModules: RecommendedModule[] = moduleRecs.map(module => ({
        module: {
          id: getModuleId(module.modulecode),
          university: module.institution,
          course_code: module.modulecode,
          title: module.title,
          description: module.description || "No description available.",
          aus_cus: 4, // Default value
          semester: "1" // Default value
        },
        reasoning: ["Based on your recommended majors"]
      }));
      
      // Update shared state
      sharedRecommendedModules = formattedModules;
      setRecommendedModules(formattedModules);
      
      console.log("Fetched modules in useModuleRecommendations:", formattedModules.length);
      return formattedModules;
    } catch (err) {
      console.error("Error fetching module recommendations:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch recommendations";
      sharedError = errorMessage;
      setError(errorMessage);
      return [];
    } finally {
      sharedLoadingState = false;
      setLoadingModules(false);
      fetchPromise = null;
    }
  };

  // Fetch recommendations on mount, but only if we don't already have them
  useEffect(() => {
    if (sharedRecommendedModules.length === 0 && !sharedLoadingState) {
      fetchRecommendations();
    } else {
      // Make sure local state reflects shared state
      setRecommendedModules(sharedRecommendedModules);
      setLoadingModules(sharedLoadingState);
      setError(sharedError);
    }
  }, []);

  return { 
    recommendedModules, 
    loadingModules, 
    error,
    refetchRecommendations: fetchRecommendations
  };
};
