import { useState, useEffect } from 'react';

export type McqQuestion = {
  id: string;
  question: string;
  options: string[];
  category: string;
  optionScores: Record<string, number>; // Added scores for options
};

// Define all quiz types
export type QuizType = 'interest-part 1' | 'interest-part 2' | 'competence' | 'work-values';

// New hook to load all MCQ questions from all files
export const useAllMcqQuestions = () => {
  const [allQuestions, setAllQuestions] = useState<Record<QuizType, McqQuestion[]>>({
    'interest-part 1': [],
    'interest-part 2': [],
    'competence': [],
    'work-values': []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAllQuestions = async () => {
      try {
        setLoading(true);
        
        // Define all quiz files and their configurations
        const quizFiles: Array<{
          type: QuizType,
          filePath: string,
          options: string[], 
          optionScores: Record<string, number>
        }> = [
          {
            type: 'interest-part 1',
            filePath: '/quiz_refer/Mcq_questions/RIASEC_interest_questions_pt1.json',
            options: ['Extremely disinterested', 'Slightly disinterested', 'Neutral', 'Slightly interested', 'Extremely interested'],
            optionScores: {
              'Extremely disinterested': 1,
              'Slightly disinterested': 2,
              'Neutral': 3, 
              'Slightly interested': 4,
              'Extremely interested': 5
            }
          },
          {
            type: 'interest-part 2',
            filePath: '/quiz_refer/Mcq_questions/RIASEC_interest_questions_pt2.json',
            options: ['Extremely disinterested', 'Slightly disinterested', 'Neutral', 'Slightly interested', 'Extremely interested'],
            optionScores: {
              'Extremely disinterested': 1,
              'Slightly disinterested': 2,
              'Neutral': 3, 
              'Slightly interested': 4,
              'Extremely interested': 5
            }
          },
          {
            type: 'competence',
            filePath: '/quiz_refer/Mcq_questions/RIASEC_competence_questions.json',
            options: ['Extremely unconfident', 'Slightly unconfident', 'Neutral', 'Slightly confident', 'Extremely confident'],
            optionScores: {
              'Extremely unconfident': 1,
              'Slightly unconfident': 2,
              'Neutral': 3,
              'Slightly confident': 4,
              'Extremely confident': 5
            }
          },
          {
            type: 'work-values',
            filePath: '/quiz_refer/Mcq_questions/Work_value_questions.json',
            options: ['Not Important At All', 'Not Very Important', 'Somewhat Important', 'Very Important', 'Extremely Important'],
            optionScores: {
              'Not Important At All': 1,
              'Not Very Important': 2,
              'Somewhat Important': 3,
              'Very Important': 4,
              'Extremely Important': 5
            }
          }
        ];

        // Create a temporary object to hold all questions
        const tempQuestions: Record<QuizType, McqQuestion[]> = {
          'interest-part 1': [],
          'interest-part 2': [],
          'competence': [],
          'work-values': []
        };

        // Load each file and parse its questions
        for (const quizFile of quizFiles) {
          const { type, filePath, options, optionScores } = quizFile;
          
          try {
            const questionsArray = await fetch(filePath).then(res => res.json());
            tempQuestions[type] = questionsArray.map((q: any, index: number) => ({
              id: q.question_number || `${type}-q-${index + 1}`,
              question: q.rephrased_text,
              options,
              category: type,
              optionScores
            }));
          } catch (err) {
            console.error(`Error loading questions for ${type}:`, err);
            tempQuestions[type] = []; // Set empty array for this type
          }
        }
        
        setAllQuestions(tempQuestions);
      } catch (err) {
        console.error('Error loading all quiz questions:', err);
        setError('Failed to load quiz questions. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadAllQuestions();
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
