
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
    const formattedModules: RecommendedModule[] = moduleRecommendations.map(module => ({
      module,
      reasoning: ["Based on your recommended majors"]
    }));
    
    setRecommendedModules(formattedModules);
    console.log("useModuleRecommendations: formatted modules count:", formattedModules.length);
  }, [moduleRecommendations]);

  return { 
    recommendedModules, 
    loadingModules: isLoading, 
    error,
    refetchRecommendations: refreshRecommendations
  };
};
