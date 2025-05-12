
import { Module, Recommendation } from "@/integrations/supabase/client";

// Interface for occupation major mappings
export interface OccupationMajorMapping {
  occupation: string;
  RIASEC_code: string;
  work_value_code: string;
  majors: string[];
}

// Define interface for matched majors by category
export interface MajorRecommendations {
  exactMatches: string[];
  permutationMatches: string[];
  riasecMatches: string[];
  workValueMatches: string[];
  questionFiles: string[]; // For sanitized filenames
  riasecCode: string;
  workValueCode: string;
  matchType: 'exact' | 'permutation' | 'riasec' | 'workValue' | 'none';
}
