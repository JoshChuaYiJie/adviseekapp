
import { useState, useEffect } from 'react';
import { fetchModuleRecommendations } from '@/utils/recommendation/moduleRecommendationUtils';
import { MajorRecommendationsType } from '@/components/sections/majors/types';
import { Module } from '@/integrations/supabase/client';

export interface RecommendedModule {
  module: Module;
  reasoning: string[];
}

export const useModuleRecommendations = () => {
  const [recommendedModules, setRecommendedModules] = useState<RecommendedModule[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Function to fetch module recommendations
  const fetchRecommendations = async () => {
    try {
      setLoadingModules(true);
      setError(null);
      
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
      
      // Get module recommendations based on these majors without limiting results
      const moduleRecs = await fetchModuleRecommendations(mockMajorRecommendations, 0);
      
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
      
      setRecommendedModules(formattedModules);
    } catch (err) {
      console.error("Error fetching module recommendations:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch recommendations");
    } finally {
      setLoadingModules(false);
    }
  };

  // Fetch recommendations on mount
  useEffect(() => {
    fetchRecommendations();
  }, []);

  return { 
    recommendedModules, 
    loadingModules, 
    error,
    refetchRecommendations: fetchRecommendations
  };
};
