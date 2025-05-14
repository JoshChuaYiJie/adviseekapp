
// Re-export from recommendation module - for backward compatibility
import {
  fetchModuleRecommendations,
  Module
} from './moduleRecommendationUtils';

import {
  generateRecommendationsUtil,
  loadUserFeedbackUtil,
  loadRecommendationsUtil,
  rateModuleUtil,
  refineRecommendationsUtil,
  getFinalSelectionsUtil,
  fetchModulesMock
} from './recommendationHelpers';

// Re-export all the functions
export {
  fetchModuleRecommendations,
  generateRecommendationsUtil,
  loadUserFeedbackUtil,
  loadRecommendationsUtil,
  rateModuleUtil,
  refineRecommendationsUtil,
  getFinalSelectionsUtil,
  fetchModulesMock,
  type Module
};
