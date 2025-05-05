import { useState, useEffect } from 'react';

export type McqQuestion = {
  id: string;
  question: string;
  options: string[];
  category: string;
  optionScores: Record<string, number>; // Added scores for options
};

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
