
import { useState, useEffect } from 'react';

export type McqQuestion = {
  id: string;
  question: string;
  options: string[];
  category: string;
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
        
        // Based on the quiz type, load the appropriate question file and options
        switch (quizType) {
          case 'interest-part1':
            questionsText = await fetch('/src/contexts/quiz/quiz_refer/Mcq_questions/RIASEC Intrests Questions pt1').then(res => res.text());
            options = ['Extremely disinterested', 'Slightly disinterested', 'Neutral', 'Slightly interested', 'Extremely interested'];
            break;
          case 'interest-part2':
            questionsText = await fetch('/src/contexts/quiz/quiz_refer/Mcq_questions/RIASEC Intrest Questions pt2').then(res => res.text());
            options = ['Extremely disinterested', 'Slightly disinterested', 'Neutral', 'Slightly interested', 'Extremely interested'];
            break;
          case 'competence':
            questionsText = await fetch('/src/contexts/quiz/quiz_refer/Mcq_questions/RIASEC Competence Questions').then(res => res.text());
            options = ['Extremely unconfident', 'Slightly unconfident', 'Neutral', 'Slightly confident', 'Extremely confident'];
            break;
          case 'work-values':
            questionsText = await fetch('/src/contexts/quiz/quiz_refer/Mcq_questions/WorkValues Questions').then(res => res.text());
            options = ['Not Important At All', 'Not Very Important', 'Somewhat Important', 'Very Important', 'Extremely Important'];
            break;
          default:
            setError(`Unknown quiz type: ${quizType}`);
            setLoading(false);
            return;
        }
        
        // Parse questions from plain text
        const parsedQuestions: McqQuestion[] = questionsText
          .split('\n')
          .filter(line => line.trim() !== '')
          .map((question, index) => ({
            id: `${quizType}-q-${index + 1}`,
            question: question.trim(),
            options,
            category: quizType
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
