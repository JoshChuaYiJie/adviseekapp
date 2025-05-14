

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

// Consistent Module interface used throughout the application
export interface Module {
  id?: number;
  modulecode: string;
  title: string;
  institution: "NUS" | "NTU" | "SMU";
  description: string;
}

// Extended module format used in some UI components
export interface UIModule {
  id: number;
  university: string;
  course_code: string;
  title: string;
  description: string;
  aus_cus: number;
  semester: string;
}

// Export other types that might be needed
export interface RecommendationResponse {
  majors: string[];
  files: string[];
}
