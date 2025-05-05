import { useState, useEffect } from 'react';

export type McqQuestion = {
  id: string;
  question: string;
  options: string[];
  category: string;
  optionScores: Record<string, number>; // Added scores for options
};

// Define all quiz types
export type QuizType = 'interest-part1' | 'interest-part2' | 'competence' | 'work-values';

// New hook to load all MCQ questions from all files
export const useAllMcqQuestions = () => {
  const [allQuestions, setAllQuestions] = useState<Record<QuizType, McqQuestion[]>>({
    'interest-part1': [],
    'interest-part2': [],
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
            type: 'interest-part1',
            filePath: '/src/contexts/quiz/quiz_refer/Mcq_questions/RIASEC Intrests Questions pt1',
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
            type: 'interest-part2',
            filePath: '/src/contexts/quiz/quiz_refer/Mcq_questions/RIASEC Intrest Questions pt2',
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
            filePath: '/src/contexts/quiz/quiz_refer/Mcq_questions/RIASEC Competence Questions',
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
            filePath: '/src/contexts/quiz/quiz_refer/Mcq_questions/WorkValues Questions',
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
          'interest-part1': [],
          'interest-part2': [],
          'competence': [],
          'work-values': []
        };

        // Load each file and parse its questions
        for (const quizFile of quizFiles) {
          const { type, filePath, options, optionScores } = quizFile;
          
          try {
            const questionsText = await fetch(filePath).then(res => res.text());
            const lines = questionsText.split('\n').filter(line => line.trim() !== '');
            
            // Process each line to extract questions with potential JSON structure
            tempQuestions[type] = lines.map((line, index) => {
              let question = line.trim();
              
              // Try to extract rephrased_text from JSON if present
              try {
                if (line.includes('{') && line.includes('}')) {
                  const jsonMatch = line.match(/{.*}/);
                  if (jsonMatch) {
                    const jsonData = JSON.parse(jsonMatch[0]);
                    if (jsonData.rephrased_text) {
                      question = jsonData.rephrased_text;
                    }
                  }
                }
              } catch (err) {
                console.error('Error parsing JSON in question:', err);
                // Keep original text if parsing fails
              }

              return {
                id: `${type}-q-${index + 1}`,
                question,
                options,
                category: type,
                optionScores
              };
            });
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
        
        let questionsText = '';
        let options: string[] = [];
        let optionScores: Record<string, number> = {};
        
        // Based on the quiz type, load the appropriate question file and options with scores
        switch (quizType) {
          case 'interest-part1':
            questionsText = await fetch('/src/contexts/quiz/quiz_refer/Mcq_questions/RIASEC Intrests Questions pt1').then(res => res.text());
            options = ['Extremely disinterested', 'Slightly disinterested', 'Neutral', 'Slightly interested', 'Extremely interested'];
            optionScores = {
              'Extremely disinterested': 1,
              'Slightly disinterested': 2,
              'Neutral': 3, 
              'Slightly interested': 4,
              'Extremely interested': 5
            };
            break;
          case 'interest-part2':
            questionsText = await fetch('/src/contexts/quiz/quiz_refer/Mcq_questions/RIASEC Intrest Questions pt2').then(res => res.text());
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
            questionsText = await fetch('/src/contexts/quiz/quiz_refer/Mcq_questions/RIASEC Competence Questions').then(res => res.text());
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
            questionsText = await fetch('/src/contexts/quiz/quiz_refer/Mcq_questions/WorkValues Questions').then(res => res.text());
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
        
        // Parse questions from plain text, looking for "rephrased_text" pattern
        const lines = questionsText.split('\n').filter(line => line.trim() !== '');
        
        // Process each line to extract questions with potential JSON structure
        const parsedQuestions: McqQuestion[] = lines.map((line, index) => {
          let question = line.trim();
          
          // Try to extract rephrased_text from JSON if present
          try {
            if (line.includes('{') && line.includes('}')) {
              const jsonMatch = line.match(/{.*}/);
              if (jsonMatch) {
                const jsonData = JSON.parse(jsonMatch[0]);
                if (jsonData.rephrased_text) {
                  question = jsonData.rephrased_text;
                }
              }
            }
          } catch (err) {
            console.error('Error parsing JSON in question:', err);
            // Keep original text if parsing fails
          }

          return {
            id: `${quizType}-q-${index + 1}`,
            question,
            options,
            category: quizType,
            optionScores
          };
        });
        
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
