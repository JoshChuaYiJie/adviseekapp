
export interface MajorProfileDisplay {
  riasecCode: string;
  workValueCode: string;
}

export interface OpenEndedQuestion {
  id?: string;
  category?: 'interests' | 'skills' | 'experience' | 'general';
  criterion: string;
  question: string;
  majorName?: string; // Add this property to fix the type errors
}

export interface OpenEndedResponse {
  question_id: string;
  response: string;
}

export interface MajorRecommendationsType {
  exactMatches?: string[];
  permutationMatches?: string[];
  riasecMatches?: string[];
  workValueMatches?: string[];
}
