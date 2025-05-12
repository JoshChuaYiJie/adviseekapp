
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useOpenEndedQuiz } from '@/hooks/useOpenEndedQuiz';
import { QuizCompleted } from './QuizCompleted';
import { QuizWelcome } from './QuizWelcome';
import { QuizInstructions } from './QuizInstructions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export const OpenEndedQuiz = () => {
  const [showQuestions, setShowQuestions] = useState(false);
  const { 
    loading, 
    completed, 
    setCompleted, 
    riasecCompleted,
    workValuesCompleted,
    handleStartQuiz 
  } = useOpenEndedQuiz();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-10 w-1/3 mt-6 mx-auto" />
      </div>
    );
  }

  if (completed) {
    return (
      <QuizCompleted 
        onRetake={() => {
          setCompleted(false);
          setShowQuestions(false);
        }} 
      />
    );
  }
  
  // Show prerequisite warning if not completed
  if (!riasecCompleted || !workValuesCompleted) {
    return (
      <div className="space-y-4">
        <QuizWelcome onStartQuiz={() => setShowQuestions(true)} />
        
        <Alert variant="default" className="mt-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 mr-2 text-amber-800 dark:text-amber-200" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">
            Required Quizzes Not Completed
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            {!riasecCompleted && (
              <p className="mb-1">Please complete the Interest and Competence quizzes first.</p>
            )}
            {!workValuesCompleted && (
              <p className="mb-1">Please complete the Work Values quiz first.</p>
            )}
            <p className="mt-1">These quizzes are needed to generate personalized questions for your interests.</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!showQuestions) {
    return <QuizWelcome onStartQuiz={() => setShowQuestions(true)} />;
  }

  return <QuizInstructions onStartQuiz={handleStartQuiz} />;
};
