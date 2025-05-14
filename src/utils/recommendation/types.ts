
// Types for major recommendations
export interface OccupationMajorMapping {
  occupation: string;
  RIASEC_code: string | null;
  work_value_code: string | null;
  majors: string[];
}

export interface MajorRecommendations {
  exactMatches: string[];
  permutationMatches: string[];
  riasecMatches: string[];
  workValueMatches: string[];
  questionFiles: string[];
  riasecCode: string;
  workValueCode: string;
  matchType: 'exact' | 'riasec' | 'workValue' | 'none';
}

// Export other types that might be needed
export interface RecommendationResponse {
  majors: string[];
  files: string[];
}
