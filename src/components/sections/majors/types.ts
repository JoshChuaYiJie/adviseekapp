
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
