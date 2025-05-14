

import { useState, useEffect } from 'react';
import { Module, UIModule } from '@/utils/recommendation/types';
import { useGlobalProfile } from '@/contexts/GlobalProfileContext';

export interface RecommendedModule {
  module: Module;
  reasoning: string[];
}

export const useModuleRecommendations = () => {
  // Get the global values from our context
  const { 
    recommendedModules: globalModules, 
    isLoading: globalLoading, 
    error: globalError,
    refreshProfileData
  } = useGlobalProfile();

  // Format the modules to match the expected interface
  const formattedModules: RecommendedModule[] = globalModules.map(module => ({
    module: {
      id: module.id || getModuleId(module.modulecode),
      modulecode: module.modulecode,
      title: module.title,
      institution: module.institution,
      description: module.description || "No description available."
    },
    reasoning: ["Based on your recommended majors"]
  }));

  // Log the loaded modules for debugging
  useEffect(() => {
    console.log("useModuleRecommendations - Loaded modules from global context:", formattedModules.length);
  }, [formattedModules.length]);

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

  return { 
    recommendedModules: formattedModules, 
    loadingModules: globalLoading, 
    error: globalError,
    refetchRecommendations: refreshProfileData
  };
};

