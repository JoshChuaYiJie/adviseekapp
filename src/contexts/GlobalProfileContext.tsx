
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mapRiasecToCode, mapWorkValueToCode, formCode, getMatchingMajors } from '@/utils/recommendation';
import { processRiasecData } from '@/components/sections/RiasecChart';
import { processWorkValuesData } from '@/components/sections/WorkValuesChart';
import { fetchModuleRecommendations } from '@/utils/recommendation/moduleRecommendationUtils';
import { Module } from '@/utils/recommendation/types';
import { MajorRecommendationsType } from '@/components/sections/majors/types';

// Define the context type
interface GlobalProfileContextType {
  riasecCode: string;
  workValueCode: string;
  recommendedMajors: {
    exactMatches: string[];
    permutationMatches: string[];
    riasecMatches: string[];
    workValueMatches: string[];
    matchType: string;
  };
  recommendedModules: Module[];
  isLoading: boolean;
  error: string | null;
  refreshProfileData: () => Promise<void>;
}

// Create the context
const GlobalProfileContext = createContext<GlobalProfileContextType>({
  riasecCode: '',
  workValueCode: '',
  recommendedMajors: {
    exactMatches: [],
    permutationMatches: [],
    riasecMatches: [],
    workValueMatches: [],
    matchType: 'none'
  },
  recommendedModules: [],
  isLoading: false,
  error: null,
  refreshProfileData: async () => {}
});

// Hook to use the context
export const useGlobalProfile = () => useContext(GlobalProfileContext);

// Provider component
export const GlobalProfileProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // State
  const [riasecCode, setRiasecCode] = useState<string>('');
  const [workValueCode, setWorkValueCode] = useState<string>('');
  const [recommendedMajors, setRecommendedMajors] = useState<{
    exactMatches: string[];
    permutationMatches: string[];
    riasecMatches: string[];
    workValueMatches: string[];
    matchType: string;
  }>({
    exactMatches: [],
    permutationMatches: [],
    riasecMatches: [],
    workValueMatches: [],
    matchType: 'none'
  });
  const [recommendedModules, setRecommendedModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load profile data function - this preserves the existing calculation logic
  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        console.log("No user ID found");
        setIsLoading(false);
        return;
      }
      console.log(`Loading user profile data for ${userId}`);

      // Get RIASEC data from chart processing function - keeping existing logic
      const riasecChartData = await processRiasecData(userId);

      // Get Work Values data from chart processing function - keeping existing logic
      const workValuesChartData = await processWorkValuesData(userId);
      console.log("RIASEC data:", riasecChartData);
      console.log("Work Value data:", workValuesChartData);
      
      let generatedRiasecCode = "";
      let generatedWorkValueCode = "";

      // Generate RIASEC code if data exists - same logic as before
      if (riasecChartData && riasecChartData.length > 0) {
        // Format data for code generation
        const formattedRiasecData = riasecChartData.map(item => ({
          component: item.name,
          average: 0,
          score: item.value
        }));
        generatedRiasecCode = formCode(formattedRiasecData, mapRiasecToCode);
        setRiasecCode(generatedRiasecCode || "RSI");
      } else {
        // Fallback if no data
        generatedRiasecCode = "RSI";
        setRiasecCode("RSI");
      }

      // Generate Work Values code if data exists - same logic as before
      if (workValuesChartData && workValuesChartData.length > 0) {
        // Format data for code generation
        const formattedWorkValuesData = workValuesChartData.map(item => ({
          component: item.name,
          average: 0,
          score: item.value
        }));
        generatedWorkValueCode = formCode(formattedWorkValuesData, mapWorkValueToCode);
        setWorkValueCode(generatedWorkValueCode || "ARS");
      } else {
        generatedWorkValueCode = "ARS";
        setWorkValueCode("ARS");
      }

      // Fetch recommended majors based on the profile codes - same logic as before
      if (generatedRiasecCode && generatedWorkValueCode) {
        const majorRecommendations = await getMatchingMajors(generatedRiasecCode, generatedWorkValueCode);
        console.log("Recommended majors:", majorRecommendations);
        setRecommendedMajors(majorRecommendations);
        
        // Fetch module recommendations based on the recommended majors - same logic as before
        try {
          const modules = await fetchModuleRecommendations(majorRecommendations);
          console.log("Recommended modules in global context:", modules.length);
          setRecommendedModules(modules);
        } catch (error) {
          console.error("Error fetching module recommendations:", error);
          setError("Failed to fetch module recommendations");
        }
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
      setError("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadProfileData();
  }, []);

  // Create the context value
  const contextValue: GlobalProfileContextType = {
    riasecCode,
    workValueCode,
    recommendedMajors,
    recommendedModules,
    isLoading,
    error,
    refreshProfileData: loadProfileData
  };

  return (
    <GlobalProfileContext.Provider value={contextValue}>
      {children}
    </GlobalProfileContext.Provider>
  );
};
