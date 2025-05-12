
// This file now serves as a re-export point for backward compatibility
// Existing components can continue importing from this file without changes

import {
  // Mappers
  mapRiasecToCode,
  mapWorkValueToCode,
  formCode,
  
  // Types
  type OccupationMajorMapping,
  type MajorRecommendations,
  
  // File Utils
  sanitizeToFilename,
  
  // Matching Utils
  arePermutations,
  getMatchingMajors,
  
  // Recommendation Helpers
  generateRecommendationsUtil,
  loadUserFeedbackUtil,
  loadRecommendationsUtil,
  rateModuleUtil,
  refineRecommendationsUtil,
  getFinalSelectionsUtil,
  fetchModulesMock
} from './recommendation';

// Re-export all utilities
export {
  // Mappers
  mapRiasecToCode,
  mapWorkValueToCode,
  formCode,
  
  // Types - using export type for type re-exports
  type OccupationMajorMapping,
  type MajorRecommendations,
  
  // File Utils
  sanitizeToFilename,
  
  // Matching Utils
  arePermutations,
  getMatchingMajors,
  
  // Recommendation Helpers
  generateRecommendationsUtil,
  loadUserFeedbackUtil,
  loadRecommendationsUtil,
  rateModuleUtil,
  refineRecommendationsUtil,
  getFinalSelectionsUtil,
  fetchModulesMock
};
