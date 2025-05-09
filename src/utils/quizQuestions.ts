import { useState, useEffect } from 'react';

export type QuizType = 'interest-part 1' | 'interest-part 2' | 'competence' | 'work-values';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  optionScores: Record<string, number>;
  riasec_component?: string;
  work_value_component?: string;
}

export interface McqQuestion {
  id: string;
  question: string;
  options: string[];
  category: string;
  optionScores: Record<string, number>;
  riasec_component?: string;
  work_value_component?: string;
}

// RIASEC component descriptions
export const riasecDescriptions: Record<string, { title: string; description: string }> = {
  'R': { 
    title: 'Realistic',
    description: 'You enjoy working with tools, machines, or nature. You prefer practical, hands-on activities and tangible results.'
  },
  'I': { 
    title: 'Investigative',
    description: 'You enjoy solving complex problems and exploring ideas. You prefer analytical, intellectual, and scientific activities.'
  },
  'A': { 
    title: 'Artistic',
    description: 'You enjoy creative expression and unstructured environments. You prefer artistic, innovative, and imaginative activities.'
  },
  'S': { 
    title: 'Social',
    description: 'You enjoy helping, teaching, and counseling others. You prefer activities that involve interaction with people.'
  },
  'E': { 
    title: 'Enterprising',
    description: 'You enjoy leading, persuading, and managing others. You prefer competitive and leadership activities.'
  },
  'C': { 
    title: 'Conventional',
    description: 'You enjoy organizing, data processing, and working with clear rules. You prefer structured and orderly activities.'
  }
};

// Work value descriptions
export const workValueDescriptions: Record<string, { title: string; description: string }> = {
  'Achievement': { 
    title: 'Achievement', 
    description: 'You value accomplishment and using your abilities to their fullest potential.' 
  },
  'Working Conditions': { 
    title: 'Working Conditions', 
    description: 'You value job security, good working environments, and comfortable settings.' 
  },
  'Recognition': { 
    title: 'Recognition', 
    description: 'You value being recognized for your contributions and receiving appreciation.' 
  },
  'Relationships': { 
    title: 'Relationships', 
    description: 'You value positive social interactions and good working relationships.' 
  },
  'Support': { 
    title: 'Support', 
    description: 'You value supportive management and competent supervision.' 
  },
  'Independence': { 
    title: 'Independence', 
    description: 'You value autonomy and the ability to work independently.' 
  },
  'Altruism': { 
    title: 'Altruism', 
    description: 'You value helping others and contributing to society.' 
  },
  'Others': { 
    title: 'Other Values', 
    description: 'You have unique values that drive your career decisions.' 
  },
};
