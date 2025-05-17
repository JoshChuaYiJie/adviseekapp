
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
}

// Create the context with default values
const RecommendationContext = createContext<RecommendationContextType>({
  majorRecommendations: null,
  updateMajorRecommendations: () => {},
  moduleRecommendations: [],
  updateModuleRecommendations: () => {},
});

// Custom hook to use the context
export const useRecommendationContext = () => useContext(RecommendationContext);

// Provider component
export const RecommendationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [majorRecommendations, setMajorRecommendations] = useState<MajorRecommendations | null>(null);
  const [moduleRecommendations, setModuleRecommendations] = useState<Module[]>([]);

  const updateMajorRecommendations = (recommendations: MajorRecommendations) => {
    setMajorRecommendations(recommendations);
  };

  const updateModuleRecommendations = (modules: Module[]) => {
    setModuleRecommendations(modules);
  };

  return (
    <RecommendationContext.Provider 
      value={{ 
        majorRecommendations, 
        updateMajorRecommendations,
        moduleRecommendations,
        updateModuleRecommendations
      }}
    >
      {children}
    </RecommendationContext.Provider>
  );
};
