
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mapRiasecToCode, mapWorkValueToCode, formCode, getMatchingMajors } from '@/utils/recommendation';
import { processRiasecData } from '@/components/sections/RiasecChart';
import { processWorkValuesData } from '@/components/sections/WorkValuesChart';
import { fetchModuleRecommendations } from '@/utils/recommendation/moduleRecommendationUtils';
import { Module } from '@/utils/recommendation/types';
import { MajorRecommendationsType } from '@/components/sections/majors/types';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
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
  
  // Load profile data function
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

      // RIASEC code generation
      let generatedRiasecCode = "RSI"; // Default fallback
      
      // Try to get RIASEC data directly from user_responses table
      const { data: riasecResponses, error: riasecError } = await supabase
        .from('user_responses')
        .select('component, score')
        .eq('user_id', userId)
        .in('quiz_type', ['interest-part 1', 'interest-part 2', 'competence'])
        .not('component', 'is', null);
        
      if (riasecError) {
        console.error('Error fetching RIASEC responses:', riasecError);
      } 
      else if (riasecResponses && riasecResponses.length > 0) {
        console.log("RIASEC responses:", riasecResponses);
        
        // Group responses by component and sum scores
        const componentScores: Record<string, number> = {};
        riasecResponses.forEach(response => {
          if (response.component) {
            componentScores[response.component] = (componentScores[response.component] || 0) + (response.score || 0);
          }
        });
        
        // Convert to array and sort by score
        const sortedComponents = Object.entries(componentScores)
          .map(([component, score]) => ({ component, score, average: 0 }))
          .sort((a, b) => b.score - a.score);
          
        console.log("Sorted RIASEC components:", sortedComponents);
        
        if (sortedComponents.length > 0) {
          generatedRiasecCode = formCode(sortedComponents, mapRiasecToCode);
          console.log(`Generated RIASEC code from responses: ${generatedRiasecCode}`);
        }
        
        setRiasecCode(generatedRiasecCode);
      } 
      else {
        // Fallback to process function
        const riasecChartData = await processRiasecData(userId);
        if (riasecChartData && riasecChartData.length > 0) {
          const formattedRiasecData = riasecChartData.map(item => ({
            component: item.name,
            average: 0,
            score: item.value
          }));
          generatedRiasecCode = formCode(formattedRiasecData, mapRiasecToCode);
          setRiasecCode(generatedRiasecCode);
        } else {
          setRiasecCode("RSI"); // Default fallback
        }
      }

      // Work Values code generation
      let generatedWorkValueCode = "ARS"; // Default fallback
      
      // Try to get Work Values data directly from user_responses table
      const { data: workValueResponses, error: workValueError } = await supabase
        .from('user_responses')
        .select('component, score')
        .eq('user_id', userId)
        .eq('quiz_type', 'work-values')
        .not('component', 'is', null);
        
      if (workValueError) {
        console.error('Error fetching Work Value responses:', workValueError);
      } 
      else if (workValueResponses && workValueResponses.length > 0) {
        console.log("Work Value responses:", workValueResponses);
        
        // Group responses by component and sum scores
        const componentScores: Record<string, number> = {};
        workValueResponses.forEach(response => {
          if (response.component) {
            componentScores[response.component] = (componentScores[response.component] || 0) + (response.score || 0);
          }
        });
        
        // Convert to array and sort by score
        const sortedComponents = Object.entries(componentScores)
          .map(([component, score]) => ({ component, score, average: 0 }))
          .sort((a, b) => b.score - a.score);
          
        console.log("Sorted Work Value components:", sortedComponents);
        
        if (sortedComponents.length > 0) {
          generatedWorkValueCode = formCode(sortedComponents, mapWorkValueToCode);
          console.log(`Generated Work Value code from responses: ${generatedWorkValueCode}`);
        }
        
        setWorkValueCode(generatedWorkValueCode);
      } 
      else {
        // Fallback to process function
        const workValuesChartData = await processWorkValuesData(userId);
        if (workValuesChartData && workValuesChartData.length > 0) {
          const formattedWorkValuesData = workValuesChartData.map(item => ({
            component: item.name,
            average: 0,
            score: item.value
          }));
          generatedWorkValueCode = formCode(formattedWorkValuesData, mapWorkValueToCode);
          setWorkValueCode(generatedWorkValueCode);
        } else {
          setWorkValueCode("ARS"); // Default fallback
        }
      }

      console.log("Final codes for recommendations:", {
        riasec: generatedRiasecCode,
        workValue: generatedWorkValueCode
      });

      // Fetch recommended majors based on the profile codes
      try {
        const majorRecommendations = await getMatchingMajors(generatedRiasecCode, generatedWorkValueCode);
        console.log("Recommended majors:", majorRecommendations);
        setRecommendedMajors(majorRecommendations);
        
        // Fetch module recommendations based on the recommended majors
        try {
          const modules = await fetchModuleRecommendations(majorRecommendations);
          console.log("Recommended modules in global context:", modules.length);
          setRecommendedModules(modules);
        } catch (error) {
          console.error("Error fetching module recommendations:", error);
          setError("Failed to fetch module recommendations");
          toast({
            title: "Error",
            description: "Failed to fetch module recommendations",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error fetching major recommendations:", error);
        setError("Failed to fetch major recommendations");
        toast({
          title: "Error",
          description: "Failed to fetch major recommendations",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
      setError("Failed to load profile data");
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
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
