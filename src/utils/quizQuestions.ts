import { useState, useEffect } from 'react';

export type QuizType = 'interest-part 1' | 'interest-part 2' | 'competence' | 'work-values';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  optionScores: Record<string, number>;
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
              optionScores
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
          optionScores
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
