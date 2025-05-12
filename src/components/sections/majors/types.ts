
export interface OpenEndedQuestion {
  id: string;
  question: string;
  criterion: string;
  category?: string;
  majorName?: string;
}

export interface OpenEndedResponse {
  response: string;
  skipped: boolean;
}

export interface MajorResponse {
  major: string;
  responses: Record<string, OpenEndedResponse>;
}

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

export interface MajorProfileDisplay {
  riasecCode: string;
  workValueCode: string;
}
