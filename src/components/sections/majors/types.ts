
export interface OpenEndedQuestion {
  id?: string;
  question: string;
  criterion: string;
  major?: string;
  school?: string;
}

export interface MajorProfileDisplay {
  riasecCode: string;
  workValueCode: string;
}

// Adding the MajorRecommendationsType interface here to keep type definitions centralized
export interface MajorRecommendationsType {
  exactMatches: string[];
  permutationMatches: string[];
  riasecMatches: string[];
  workValueMatches: string[];
  questionFiles: string[];
  riasecCode: string;
  workValueCode: string;
  matchType: 'exact' | 'permutation' | 'riasec' | 'workValue' | 'none';
}

// Interface for open-ended question responses
export interface OpenEndedResponse {
  questionId: string;
  question: string;
  response: string;
  criterion: string;
  major?: string;
  school?: string;
}
