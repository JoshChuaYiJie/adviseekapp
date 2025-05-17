
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define types for our context
interface MajorRecommendations {
  exactMatches: string[];
  permutationMatches: string[];
  riasecMatches: string[];
  workValueMatches: string[];
  matchType?: string;
}

interface Module {
  id: number;
  university: string;
  course_code: string;
  title: string;
  description: string;
  aus_cus: number;
  semester: string;
}

interface RecommendationContextType {
  majorRecommendations: MajorRecommendations | null;
  updateMajorRecommendations: (recommendations: MajorRecommendations) => void;
  moduleRecommendations: Module[];
  updateModuleRecommendations: (modules: Module[]) => void;
  isLoading: boolean;
  error: Error | null;
  refreshRecommendations: () => Promise<void>;
}

// Create the context with default values
const RecommendationContext = createContext<RecommendationContextType>({
  majorRecommendations: null,
  updateMajorRecommendations: () => {},
  moduleRecommendations: [],
  updateModuleRecommendations: () => {},
  isLoading: false,
  error: null,
  refreshRecommendations: async () => {}
});

// Custom hook to use the context
export const useRecommendationContext = () => useContext(RecommendationContext);

// Provider component
export const RecommendationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [majorRecommendations, setMajorRecommendations] = useState<MajorRecommendations | null>(null);
  const [moduleRecommendations, setModuleRecommendations] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const updateMajorRecommendations = (recommendations: MajorRecommendations) => {
    setMajorRecommendations(recommendations);
  };

  const updateModuleRecommendations = (modules: Module[]) => {
    setModuleRecommendations(modules);
  };
  
  const refreshRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This would normally fetch recommendations from an API
      // Currently this is just a placeholder since we're updating recommendations
      // via the updateModuleRecommendations and updateMajorRecommendations methods
      console.log("Refreshing recommendations...");
      // Add actual implementation if needed in the future
    } catch (err: any) {
      console.error("Error refreshing recommendations:", err);
      setError(err instanceof Error ? err : new Error(err?.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RecommendationContext.Provider 
      value={{ 
        majorRecommendations, 
        updateMajorRecommendations,
        moduleRecommendations,
        updateModuleRecommendations,
        isLoading,
        error,
        refreshRecommendations
      }}
    >
      {children}
    </RecommendationContext.Provider>
  );
};
