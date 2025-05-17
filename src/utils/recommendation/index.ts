
// Re-export from recommendation module - for backward compatibility
import {
  fetchModuleRecommendations,
  Module
} from './moduleRecommendationUtils';

// Import mappers
import {
  mapRiasecToCode,
  mapWorkValueToCode,
  formCode
} from './mappers';

// Import matching utils
import {
  arePermutations,
  matchShortCode
} from './codeMatchingUtils';

// Import major matching
import {
  getMatchingMajors
} from './majorMatching';

// Import types
import type { 
  OccupationMajorMapping,
  MajorRecommendations
} from './types';

// Import file utils
import {
  sanitizeToFilename
} from './fileUtils';

import {
  generateRecommendationsUtil,
  loadUserFeedbackUtil,
  loadRecommendationsUtil,
  rateModuleUtil,
  refineRecommendationsUtil,
  getFinalSelectionsUtil,
  fetchModulesMock
} from './recommendationHelpers';

// Re-export all the functions and types
export {
  // Mappers
  mapRiasecToCode,
  mapWorkValueToCode,
  formCode,
  
  // Code matching utils
  arePermutations,
  matchShortCode,
  
  // Major matching
  getMatchingMajors,
  
  // Types
  type OccupationMajorMapping,
  type MajorRecommendations,
  
  // File utils
  sanitizeToFilename,
  
  // Module recommendations
  fetchModuleRecommendations,
  type Module,
  
  // Recommendation helpers
  generateRecommendationsUtil,
  loadUserFeedbackUtil,
  loadRecommendationsUtil,
  rateModuleUtil,
  refineRecommendationsUtil,
  getFinalSelectionsUtil,
  fetchModulesMock
};
