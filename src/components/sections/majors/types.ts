
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
