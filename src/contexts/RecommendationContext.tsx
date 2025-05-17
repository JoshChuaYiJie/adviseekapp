
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Module } from '@/integrations/supabase/client';
import { MajorRecommendationsType } from '@/components/sections/majors/types';
import { 
  mapRiasecToCode, 
  mapWorkValueToCode, 
  formCode,
  getMatchingMajors
} from '@/utils/recommendation';
import { fetchModuleRecommendations } from '@/utils/recommendation/moduleRecommendationUtils';
import { supabase } from '@/integrations/supabase/client';

interface RecommendationContextType {
  riasecCode: string;
  workValueCode: string;
  majorRecommendations: MajorRecommendationsType | null;
  moduleRecommendations: Module[];
  isLoading: boolean;
  error: string | null;
  refreshRecommendations: () => Promise<void>;
  updateModuleRecommendations: (modules: Module[]) => void;
}

const defaultContext: RecommendationContextType = {
  riasecCode: '',
  workValueCode: '',
  majorRecommendations: null,
  moduleRecommendations: [],
  isLoading: true,
  error: null,
  refreshRecommendations: async () => {},
  updateModuleRecommendations: () => {},
};

const RecommendationContext = createContext<RecommendationContextType>(defaultContext);

export const useRecommendationContext = () => useContext(RecommendationContext);

export const RecommendationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // State variables for our global data
  const [riasecCode, setRiasecCode] = useState<string>('');
  const [workValueCode, setWorkValueCode] = useState<string>('');
  const [majorRecommendations, setMajorRecommendations] = useState<MajorRecommendationsType | null>(null);
  const [moduleRecommendations, setModuleRecommendations] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [codesLoaded, setCodesLoaded] = useState<boolean>(false);

  // Ensure diverse module recommendations by prioritizing unique prefixes
  const diversifyModules = useCallback((modules: Module[]): Module[] => {
    // Group modules by their prefix
    const prefixModuleMap: Record<string, Module[]> = {};
    
    // Extract prefix from course code (usually first 2-3 characters before numbers)
    modules.forEach(module => {
      const match = module.course_code.match(/^[A-Z]+/);
      const prefix = match ? match[0] : 'OTHER';
      
      if (!prefixModuleMap[prefix]) {
        prefixModuleMap[prefix] = [];
      }
      
      prefixModuleMap[prefix].push(module);
    });
    
    // First, take one module from each prefix to ensure diversity
    const diverseModules: Module[] = [];
    const prefixes = Object.keys(prefixModuleMap);
    
    // Take first one from each prefix
    prefixes.forEach(prefix => {
      if (prefixModuleMap[prefix].length > 0) {
        // Take one module from this prefix
        const module = prefixModuleMap[prefix].shift();
        if (module) diverseModules.push(module);
      }
    });
    
    // Then add the remaining modules
    prefixes.forEach(prefix => {
      if (prefixModuleMap[prefix].length > 0) {
        // Shuffle the remaining modules for this prefix
        const shuffled = [...prefixModuleMap[prefix]].sort(() => 0.5 - Math.random());
        diverseModules.push(...shuffled);
      }
    });
    
    // Return the final diversified list
    return diverseModules;
  }, []);

  // Load RIASEC and Work Value codes from localStorage only once
  useEffect(() => {
    if (codesLoaded) return;
    
    const loadCodes = () => {
      try {
        // Get RIASEC components
        const riasecComponents = JSON.parse(localStorage.getItem('top_riasec') || '[]');
        
        // Get Work Value components
        const workValueComponents = JSON.parse(localStorage.getItem('top_work_values') || '[]');
        
        console.log("Loaded from localStorage - RIASEC:", riasecComponents);
        console.log("Loaded from localStorage - Work Values:", workValueComponents);
        
        // Generate codes using the exact same logic as before
        if (riasecComponents && riasecComponents.length > 0) {
          const generatedRiasecCode = formCode(riasecComponents, mapRiasecToCode);
          setRiasecCode(generatedRiasecCode);
          console.log("Generated RIASEC code:", generatedRiasecCode);
        } else {
          // Default fallback
          const defaultRiasecCode = 'SAE';
          setRiasecCode(defaultRiasecCode);
          console.log("Using default RIASEC code:", defaultRiasecCode);
        }
        
        if (workValueComponents && workValueComponents.length > 0) {
          const generatedWorkValueCode = formCode(workValueComponents, mapWorkValueToCode);
          setWorkValueCode(generatedWorkValueCode);
          console.log("Generated Work Values code:", generatedWorkValueCode);
        } else {
          // Default fallback
          const defaultWorkValueCode = 'ARS';
          setWorkValueCode(defaultWorkValueCode);
          console.log("Using default Work Values code:", defaultWorkValueCode);
        }
        
        setCodesLoaded(true);
      } catch (error) {
        console.error("Error loading codes from localStorage:", error);
        // Use default fallbacks
        setRiasecCode('SAE');
        setWorkValueCode('ARS');
        setCodesLoaded(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadCodes();
  }, [codesLoaded]);

  // Load major recommendations whenever codes change
  useEffect(() => {
    if (!riasecCode || !workValueCode) return;
    
    const loadMajorRecommendations = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching major recommendations with codes:", riasecCode, workValueCode);
        const majors = await getMatchingMajors(riasecCode, workValueCode);
        console.log("Loaded major recommendations:", majors);
        setMajorRecommendations(majors);
        
        // Store in localStorage for persistence
        localStorage.setItem('major_recommendations', JSON.stringify(majors));
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading major recommendations:", error);
        setIsLoading(false);
      }
    };
    
    loadMajorRecommendations();
  }, [riasecCode, workValueCode]);

  // Load module recommendations whenever major recommendations change
  const loadModuleRecommendations = useCallback(async () => {
    if (!majorRecommendations) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Fetching module recommendations based on majors:", majorRecommendations);
      
      // Use the fetchModuleRecommendations utility
      const modules = await fetchModuleRecommendations(majorRecommendations, 0);
      
      console.log("Raw modules from fetchModuleRecommendations:", modules.length);
      
      // Generate consistent module IDs - keeping the same logic
      const modulesWithIds = modules.map(module => ({
        id: getModuleId(module.modulecode),
        university: module.institution,
        course_code: module.modulecode,
        title: module.title,
        description: module.description || "No description available.",
        aus_cus: 4, // Default value
        semester: "1" // Default value
      }));
      
      // Diversify modules to ensure we have a good mix of prefixes
      const diverseModules = diversifyModules(modulesWithIds);
      
      console.log("Loaded and diversified module recommendations:", diverseModules.length);
      setModuleRecommendations(diverseModules);
    } catch (error) {
      console.error("Error loading module recommendations:", error);
      setError("Failed to load module recommendations");
    } finally {
      setIsLoading(false);
    }
  }, [majorRecommendations, diversifyModules]);
  
  // Generate consistent module IDs based on modulecode
  const getModuleId = (code: string) => {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  // Function to update module recommendations directly (for use in AboutMe.tsx)
  const updateModuleRecommendations = useCallback((modules: Module[]) => {
    console.log("Updating global module recommendations:", modules.length);
    setModuleRecommendations(modules);
  }, []);

  // Refresh all recommendations - but avoid unnecessary recalculations
  const refreshRecommendations = useCallback(async () => {
    try {
      console.log("Refreshing all recommendations...");
      setIsLoading(true);
      
      // Reload codes from localStorage (in case they were updated)
      const riasecComponents = JSON.parse(localStorage.getItem('top_riasec') || '[]');
      const workValueComponents = JSON.parse(localStorage.getItem('top_work_values') || '[]');
      
      if (riasecComponents.length > 0) {
        const newRiasecCode = formCode(riasecComponents, mapRiasecToCode);
        setRiasecCode(newRiasecCode);
      }
      
      if (workValueComponents.length > 0) {
        const newWorkValueCode = formCode(workValueComponents, mapWorkValueToCode);
        setWorkValueCode(newWorkValueCode);
      }
      
      // The code and major recommendations will be updated through the effects
    } catch (error) {
      console.error("Error refreshing recommendations:", error);
      setError("Failed to refresh recommendations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Ensure module recommendations are loaded whenever majorRecommendations changes
  useEffect(() => {
    if (majorRecommendations) {
      loadModuleRecommendations();
    }
  }, [majorRecommendations, loadModuleRecommendations]);

  // Memoize the context value to prevent unnecessary rerenders
  const contextValue = useMemo(() => ({
    riasecCode,
    workValueCode,
    majorRecommendations,
    moduleRecommendations,
    isLoading,
    error,
    refreshRecommendations,
    updateModuleRecommendations
  }), [
    riasecCode, 
    workValueCode, 
    majorRecommendations, 
    moduleRecommendations, 
    isLoading, 
    error, 
    refreshRecommendations, 
    updateModuleRecommendations
  ]);

  return (
    <RecommendationContext.Provider value={contextValue}>
      {children}
    </RecommendationContext.Provider>
  );
};
