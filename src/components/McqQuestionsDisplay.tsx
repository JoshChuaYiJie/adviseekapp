
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from '@/contexts/ThemeContext';

// Define QuizType type
export type QuizType = 'interest-part 1' | 'interest-part 2' | 'competence' | 'work-values';

// Define McqQuestion interface
interface McqQuestion {
  id: string;
  question: string;
  options: string[];
  category: string;
  optionScores: Record<string, number>;
  riasec_component?: string;
  work_value_component?: string;
}

const QuestionSkeleton = () => (
  <div className="space-y-3 mb-6">
    <Skeleton className="h-6 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

export const McqQuestionsDisplay = () => {
  const [activeTab, setActiveTab] = useState<QuizType>('interest-part 1');
  const { isCurrentlyDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allQuestions, setAllQuestions] = useState<Record<QuizType, McqQuestion[]>>({
    'interest-part 1': [],
    'interest-part 2': [],
    'competence': [],
    'work-values': []
  });
  
  const quizTypeLabels: Record<QuizType, string> = {
    'interest-part 1': 'Interest Part 1',
    'interest-part 2': 'Interest Part 2',
    'competence': 'Competence',
    'work-values': 'Work Values'
  };
  
  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      try {
        const options = {
          'interest-part 1': {
            options: ['Extremely disinterested', 'Slightly disinterested', 'Neutral', 'Slightly interested', 'Extremely interested'],
            optionScores: {
              'Extremely disinterested': 1,
              'Slightly disinterested': 2,
              'Neutral': 3, 
              'Slightly interested': 4,
              'Extremely interested': 5
            }
          },
          'interest-part 2': {
            options: ['Extremely disinterested', 'Slightly disinterested', 'Neutral', 'Slightly interested', 'Extremely interested'],
            optionScores: {
              'Extremely disinterested': 1,
              'Slightly disinterested': 2,
              'Neutral': 3, 
              'Slightly interested': 4,
              'Extremely interested': 5
            }
          },
          'competence': {
            options: ['Extremely unconfident', 'Slightly unconfident', 'Neutral', 'Slightly confident', 'Extremely confident'],
            optionScores: {
              'Extremely unconfident': 1,
              'Slightly unconfident': 2,
              'Neutral': 3,
              'Slightly confident': 4,
              'Extremely confident': 5
            }
          },
          'work-values': {
            options: ['Not Important At All', 'Not Very Important', 'Somewhat Important', 'Very Important', 'Extremely Important'],
            optionScores: {
              'Not Important At All': 1,
              'Not Very Important': 2,
              'Somewhat Important': 3,
              'Very Important': 4,
              'Extremely Important': 5
            }
          }
        };
        
        const results: Record<QuizType, McqQuestion[]> = {
          'interest-part 1': [],
          'interest-part 2': [],
          'competence': [],
          'work-values': []
        };

        // Load questions for each quiz type
        for (const quizType of Object.keys(quizTypeLabels) as QuizType[]) {
          const response = await fetch(`/quiz_refer/Mcq_questions/${quizType === 'interest-part 1' ? 'RIASEC_interest_questions_pt1.json' : 
                                        quizType === 'interest-part 2' ? 'RIASEC_interest_questions_pt2.json' : 
                                        quizType === 'competence' ? 'RIASEC_competence_questions.json' : 
                                        'Work_value_questions.json'}`);
                                        
          if (!response.ok) {
            throw new Error(`Failed to load ${quizType} questions`);
          }
          
          const data = await response.json();
          
          results[quizType] = data.map((q: any) => ({
            id: q.question_number,
            question: q.rephrased_text || q.question,
            options: options[quizType].options,
            category: quizType,
            optionScores: options[quizType].optionScores,
            riasec_component: q.riasec_component,
            work_value_component: q.work_value_component
          }));
        }
        
        setAllQuestions(results);
      } catch (err) {
        console.error('Error loading questions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };
    
    loadQuestions();
  }, []);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as QuizType);
  };

  if (error) {
    return (
      <div className="w-full p-6 rounded-lg bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
        <h3 className="text-lg font-medium mb-2">Error Loading Questions</h3>
        <p>{error}</p>
        <Button 
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <h2 className="text-2xl font-bold mb-6">MCQ Questions Explorer</h2>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-4 flex flex-wrap">
          {Object.keys(quizTypeLabels).map((type) => (
            <TabsTrigger key={type} value={type}>
              {quizTypeLabels[type as QuizType]}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {Object.keys(allQuestions).map((type) => (
          <TabsContent key={type} value={type} className="space-y-6 w-full">
            <Card className={`p-6 ${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow w-full`}>
              <h3 className="text-xl font-semibold mb-4">{quizTypeLabels[type as QuizType]}</h3>
              
              {loading ? (
                <div className="space-y-6">
                  {Array(5).fill(0).map((_, i) => (
                    <QuestionSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {allQuestions[type as QuizType].length} questions found
                  </p>
                  
                  {allQuestions[type as QuizType].map((q, index) => (
                    <div 
                      key={q.id} 
                      className={`p-4 rounded-md ${
                        isCurrentlyDark ? 'bg-gray-700' : 'bg-gray-50'
                      } mb-4`}
                    >
                      <div className="flex items-start">
                        <span className="mr-2 font-medium">{index + 1}.</span>
                        <div>
                          <p className="font-medium">{q.question}</p>
                          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <p className="font-semibold">Options:</p>
                            <ul className="list-disc pl-5 mt-1">
                              {q.options?.map((option: string, i: number) => (
                                <li key={i}>
                                  {option} <span className="ml-1 text-xs">(Score: {q.optionScores?.[option]})</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          {q.riasec_component && (
                            <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                              <span className="font-semibold">RIASEC Component:</span> {q.riasec_component}
                            </p>
                          )}
                          {q.work_value_component && (
                            <p className="mt-2 text-sm text-purple-600 dark:text-purple-400">
                              <span className="font-semibold">Work Value Component:</span> {q.work_value_component}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
