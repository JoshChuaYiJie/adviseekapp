
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

interface QuizQuestionsMap {
  [key: string]: QuizQuestion[];
}

export const useAllMcqQuestions = () => {
  const [allQuestions, setAllQuestions] = useState<QuizQuestionsMap>({
    'interest-part 1': [],
    'interest-part 2': [],
    'competence': [],
    'work-values': []
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const questionsMap: QuizQuestionsMap = {
          'interest-part 1': [],
          'interest-part 2': [],
          'competence': [],
          'work-values': []
        };
        
        // Define file paths and their corresponding types
        const filesToLoad = [
          { path: '/quiz_refer/Mcq_questions/RIASEC_interest_questions_pt1.json', type: 'interest-part 1' },
          { path: '/quiz_refer/Mcq_questions/RIASEC_interest_questions_pt2.json', type: 'interest-part 2' },
          { path: '/quiz_refer/Mcq_questions/RIASEC_competence_questions.json', type: 'competence' },
          { path: '/quiz_refer/Mcq_questions/Work_value_questions.json', type: 'work-values' }
        ];
        
        // Load all files concurrently
        const responses = await Promise.all(filesToLoad.map(file => fetch(file.path)));
        
        // Process each response
        for (let i = 0; i < responses.length; i++) {
          const response = responses[i];
          const fileType = filesToLoad[i].type as QuizType;
          
          if (!response.ok) {
            throw new Error(`Failed to fetch ${filesToLoad[i].path}: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (!Array.isArray(data)) {
            throw new Error(`Invalid data format in ${filesToLoad[i].path}: expected array`);
          }
          
          // Map the data to our question format
          questionsMap[fileType] = data.map((item: any, index: number) => {
            // Define the question options and scores based on the quiz type
            let options: string[] = [];
            let optionScores: Record<string, number> = {};
            
            if (fileType.includes('interest')) {
              options = [
                'Extremely disinterested',
                'Slightly disinterested',
                'Neutral',
                'Slightly interested',
                'Extremely interested'
              ];
              optionScores = {
                'Extremely disinterested': 1,
                'Slightly disinterested': 2,
                'Neutral': 3,
                'Slightly interested': 4,
                'Extremely interested': 5
              };
            } else if (fileType === 'competence') {
              options = [
                'Extremely unconfident',
                'Slightly unconfident',
                'Neutral',
                'Slightly confident',
                'Extremely confident'
              ];
              optionScores = {
                'Extremely unconfident': 1,
                'Slightly unconfident': 2,
                'Neutral': 3,
                'Slightly confident': 4,
                'Extremely confident': 5
              };
            } else if (fileType === 'work-values') {
              options = [
                'Not important at all',
                'Not very important',
                'Somewhat important',
                'Very Important',
                'Extremely Important'
              ];
              optionScores = {
                'Not important at all': 1,
                'Not very important': 2,
                'Somewhat important': 3,
                'Very Important': 4,
                'Extremely Important': 5
              };
            }
            
            return {
              id: `${fileType}-${index}`,
              question: item.rephrased_text || item.question || 'Question text missing',
              options,
              optionScores,
              riasec_component: item.riasec_component || undefined,
              work_value_component: item.work_value_component || undefined
            };
          });
        }
        
        setAllQuestions(questionsMap);
      } catch (err) {
        console.error('Error loading MCQ questions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quiz questions');
      } finally {
        setLoading(false);
      }
    };
    
    loadQuestions();
  }, []);
  
  return { allQuestions, loading, error };
};

// Keep the existing useQuizQuestions hook for backward compatibility
export const useQuizQuestions = (quizType: string) => {
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        
        let questionsArray: any[] = [];
        let options: string[] = [];
        let optionScores: Record<string, number> = {};
        
        // Based on the quiz type, load the appropriate question file and options with scores
        switch (quizType) {
          case 'interest-part 1':
            questionsArray = await fetch('/quiz_refer/Mcq_questions/RIASEC_interest_questions_pt1.json').then(res => res.json());
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
            questionsArray = await fetch('/quiz_refer/Mcq_questions/RIASEC_interest_questions_pt2.json').then(res => res.json());
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
            questionsArray = await fetch('/quiz_refer/Mcq_questions/RIASEC_competence_questions.json').then(res => res.json());
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
            questionsArray = await fetch('/quiz_refer/Mcq_questions/Work_value_questions.json').then(res => res.json());
            options = ['Not Important At All', 'Not Very Important', 'Somewhat Important', 'Very Important', 'Extremely Important'];
            optionScores = {
              'Not Important At All': 1,
              'Not Very Important': 2,
              'Somewhat Important': 3,
              'Very Important': 4,
              'Extremely Important': 5
            };
            break;
          default:
            setError(`Unknown quiz type: ${quizType}`);
            setLoading(false);
            return;
        }
        
        const parsedQuestions: McqQuestion[] = questionsArray.map((q, index) => ({
          id: q.question_number || `${quizType}-q-${index + 1}`,
          question: q.rephrased_text,
          options,
          category: quizType,
          optionScores,
          riasec_component: q.riasec_component,
          work_value_component: q.work_value_component
        }));
        
        setQuestions(parsedQuestions);
      } catch (err) {
        console.error('Error loading quiz questions:', err);
        setError('Failed to load quiz questions. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, [quizType]);
  
  return { questions, loading, error };
};

// New utility functions for calculating personality traits
export const calculateRiasecScores = () => {
  const riasecScores: Record<string, { total: number; count: number; average: number }> = {
    'R': { total: 0, count: 0, average: 0 },
    'I': { total: 0, count: 0, average: 0 },
    'A': { total: 0, count: 0, average: 0 },
    'S': { total: 0, count: 0, average: 0 },
    'E': { total: 0, count: 0, average: 0 },
    'C': { total: 0, count: 0, average: 0 }
  };

  // RIASEC quiz types to process
  const riasecQuizTypes = ['interest-part 1', 'interest-part 2', 'competence'];
  
  // Process each quiz type
  riasecQuizTypes.forEach(quizType => {
    const scores = JSON.parse(localStorage.getItem(`quiz_scores_${quizType}`) || '{}');
    const questions = JSON.parse(localStorage.getItem(`quiz_questions_${quizType}`) || '[]');
    
    // Map each question to its RIASEC component
    const questionComponents: Record<string, string> = {};
    questions.forEach((q: any) => {
      if (q.id && q.riasec_component) {
        questionComponents[q.id] = q.riasec_component;
      }
    });
    
    // Add scores to the appropriate RIASEC component
    Object.entries(scores).forEach(([questionId, score]) => {
      const component = questionComponents[questionId];
      if (component && riasecScores[component]) {
        riasecScores[component].total += Number(score);
        riasecScores[component].count += 1;
      }
    });
  });
  
  // Calculate averages
  Object.keys(riasecScores).forEach(component => {
    if (riasecScores[component].count > 0) {
      riasecScores[component].average = riasecScores[component].total / riasecScores[component].count;
    }
  });
  
  return riasecScores;
};

export const calculateWorkValueScores = () => {
  const workValueScores: Record<string, { total: number; count: number; average: number }> = {};
  
  // Load work values quiz data
  const scores = JSON.parse(localStorage.getItem(`quiz_scores_work-values`) || '{}');
  const questions = JSON.parse(localStorage.getItem(`quiz_questions_work-values`) || '[]');
  
  // Map each question to its work value component
  const questionComponents: Record<string, string> = {};
  questions.forEach((q: any) => {
    if (q.id && q.work_value_component) {
      questionComponents[q.id] = q.work_value_component;
      
      // Initialize the work value in our scores object if it doesn't exist
      if (!workValueScores[q.work_value_component]) {
        workValueScores[q.work_value_component] = { total: 0, count: 0, average: 0 };
      }
    }
  });
  
  // Add scores to the appropriate work value component
  Object.entries(scores).forEach(([questionId, score]) => {
    const component = questionComponents[questionId];
    if (component && workValueScores[component]) {
      workValueScores[component].total += Number(score);
      workValueScores[component].count += 1;
    }
  });
  
  // Calculate averages
  Object.keys(workValueScores).forEach(component => {
    if (workValueScores[component].count > 0) {
      workValueScores[component].average = workValueScores[component].total / workValueScores[component].count;
    }
  });
  
  return workValueScores;
};

export const getTopComponents = (scores: Record<string, { total: number; count: number; average: number }>, limit = 3) => {
  return Object.entries(scores)
    .filter(([_, data]) => data.count > 0) // Only consider components with answered questions
    .sort((a, b) => b[1].average - a[1].average) // Sort by average score descending
    .slice(0, limit) // Take top N
    .map(([component, data]) => ({
      component,
      average: data.average,
      score: Math.round(data.average * 20) // Convert to a 0-100 scale for display
    }));
};

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
