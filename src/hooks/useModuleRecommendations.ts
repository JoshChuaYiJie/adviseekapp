
import { useState, useEffect } from 'react';
import { useRecommendationContext } from '@/contexts/RecommendationContext';

// Define the Module interface matching what's in RecommendationContext
interface Module {
  id: number;
  university: string; // This will be cast to proper type when needed
  course_code: string;
  title: string;
  description: string;
  aus_cus: number;
  semester: string;
}

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
      // Cast university to the correct type when needed
      const formattedModules = moduleRecommendations.map(module => ({
        module: {
          ...module,
          // Ensure university is one of the allowed values
          university: module.university as "NUS" | "NTU" | "SMU"
        },
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
