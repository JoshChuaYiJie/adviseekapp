
import { useState, useEffect } from 'react';
import { useRecommendationContext } from '@/contexts/RecommendationContext';
import { Module } from '@/integrations/supabase/client';

export interface RecommendedModule {
  module: Module;
  reasoning: string[];
}

export const useModuleRecommendations = () => {
  const { 
    moduleRecommendations, 
    isLoading, 
    error,
    refreshRecommendations 
  } = useRecommendationContext();
  
  const [recommendedModules, setRecommendedModules] = useState<RecommendedModule[]>([]);

  // Convert the global modules to the RecommendedModule format
  useEffect(() => {
    console.log("useModuleRecommendations: Converting global modules, count:", moduleRecommendations.length);
    
    if (moduleRecommendations.length > 0) {
      const formattedModules: RecommendedModule[] = moduleRecommendations.map(module => ({
        module,
        reasoning: ["Based on your recommended majors"]
      }));
      
      setRecommendedModules(formattedModules);
      console.log("useModuleRecommendations: Formatted modules count:", formattedModules.length);
    } else {
      console.log("No modules available in global context");
      setRecommendedModules([]);
    }
  }, [moduleRecommendations]);

  return { 
    recommendedModules, 
    loadingModules: isLoading, 
    error,
    refetchRecommendations: refreshRecommendations
  };
};
