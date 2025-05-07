
import { useState } from 'react';
import { useAllMcqQuestions, QuizType } from '@/utils/quizQuestions';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from '@/contexts/ThemeContext';

const QuestionSkeleton = () => (
  <div className="space-y-3 mb-6">
    <Skeleton className="h-6 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

export const McqQuestionsDisplay = () => {
  const { allQuestions, loading, error } = useAllMcqQuestions();
  const [activeTab, setActiveTab] = useState<QuizType>('interest-part 1');
  const { isCurrentlyDark } = useTheme();
  
  const quizTypeLabels: Record<QuizType, string> = {
    'interest-part 1': 'Interest Part 1',
    'interest-part 2': 'Interest Part 2',
    'competence': 'Competence',
    'work-values': 'Work Values'
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as QuizType);
  };

  if (error) {
    return (
      <div className="p-6 rounded-lg bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
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
    <div className="container mx-auto p-4">
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
          <TabsContent key={type} value={type} className="space-y-6">
            <Card className={`p-6 ${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow`}>
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
                              {q.options.map((option, i) => (
                                <li key={i}>
                                  {option} <span className="ml-1 text-xs">(Score: {q.optionScores[option]})</span>
                                </li>
                              ))}
                            </ul>
                          </div>
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
