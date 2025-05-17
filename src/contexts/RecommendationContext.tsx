
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Module } from '@/integrations/supabase/client';
import { MajorRecommendationsType } from '@/components/sections/majors/types';
import { 
  mapRiasecToCode, 
  mapWorkValueToCode, 
  formCode,
  getMatchingMajors
} from '@/utils/recommendation';
import { fetchModuleRecommendations } from '@/utils/recommendation/moduleRecommendationUtils';

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

  // Load RIASEC and Work Value codes from localStorage
  useEffect(() => {
    const loadCodes = async () => {
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
      } catch (error) {
        console.error("Error loading codes from localStorage:", error);
        // Use default fallbacks
        setRiasecCode('SAE');
        setWorkValueCode('ARS');
      } finally {
        setIsLoading(false);
      }
    };

    loadCodes();
  }, []);

  // Load major recommendations whenever codes change
  useEffect(() => {
    const loadMajorRecommendations = async () => {
      if (!riasecCode || !workValueCode) return;
      
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
  useEffect(() => {
    const loadModuleRecommendations = async () => {
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
        
        console.log("Loaded module recommendations:", modulesWithIds.length);
        setModuleRecommendations(modulesWithIds);
      } catch (error) {
        console.error("Error loading module recommendations:", error);
        setError("Failed to load module recommendations");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadModuleRecommendations();
  }, [majorRecommendations]);

  // Generate consistent module IDs based on modulecode - EXACTLY as in existing code
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
  const updateModuleRecommendations = (modules: Module[]) => {
    console.log("Updating global module recommendations:", modules.length);
    setModuleRecommendations(modules);
  };

  // Refresh all recommendations
  const refreshRecommendations = async () => {
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
  };

  return (
    <RecommendationContext.Provider 
      value={{
        riasecCode,
        workValueCode,
        majorRecommendations,
        moduleRecommendations,
        isLoading,
        error,
        refreshRecommendations,
        updateModuleRecommendations
      }}
    >
      {children}
    </RecommendationContext.Provider>
  );
};
