
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

// Utility function to load quiz questions
export const loadQuizQuestions = async (quizType: QuizType): Promise<McqQuestion[]> => {
  try {
    let options: string[] = [];
    let optionScores: Record<string, number> = {};
    let filePath = '';
    
    switch (quizType) {
      case 'interest-part 1':
        filePath = '/quiz_refer/Mcq_questions/RIASEC_interest_questions_pt1.json';
        options = ['Extremely disinterested', 'Slightly disinterested', 'Neutral', 'Slightly interested', 'Extremely interested'];
        optionScores = {
          'Extremely disinterested': 1,
          'Slightly disinterested': 2,
          'Neutral': 3, 
          'Slightly interested': 4,
          'Extremely interested': 5
        };
        break;
      case 'interest-part 2':
        filePath = '/quiz_refer/Mcq_questions/RIASEC_interest_questions_pt2.json';
        options = ['Extremely disinterested', 'Slightly disinterested', 'Neutral', 'Slightly interested', 'Extremely interested'];
        optionScores = {
          'Extremely disinterested': 1,
          'Slightly disinterested': 2,
          'Neutral': 3, 
          'Slightly interested': 4,
          'Extremely interested': 5
        };
        break;
      case 'competence':
        filePath = '/quiz_refer/Mcq_questions/RIASEC_competence_questions.json';
        options = ['Extremely unconfident', 'Slightly unconfident', 'Neutral', 'Slightly confident', 'Extremely confident'];
        optionScores = {
          'Extremely unconfident': 1,
          'Slightly unconfident': 2,
          'Neutral': 3,
          'Slightly confident': 4,
          'Extremely confident': 5
        };
        break;
      case 'work-values':
        filePath = '/quiz_refer/Mcq_questions/Work_value_questions.json';
        options = ['Not Important At All', 'Not Very Important', 'Somewhat Important', 'Very Important', 'Extremely Important'];
        optionScores = {
          'Not Important At All': 1,
          'Not Very Important': 2,
          'Somewhat Important': 3,
          'Very Important': 4,
          'Extremely Important': 5
        };
        break;
    }
    
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load ${quizType} questions`);
    }
    
    const questionsArray = await response.json();
    
    return questionsArray.map((q: any) => ({
      id: q.question_number,
      question: q.rephrased_text || q.question,
      options,
      category: quizType,
      optionScores,
      riasec_component: q.riasec_component,
      work_value_component: q.work_value_component
    }));
  } catch (error) {
    console.error('Error loading quiz questions:', error);
    throw error;
  }
};

// Custom hook for loading quiz questions
export const useQuizData = (quizType: QuizType) => {
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const data = await loadQuizQuestions(quizType);
        setQuestions(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load questions');
        console.error('Error in useQuizData:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, [quizType]);
  
  return { questions, loading, error };
};
