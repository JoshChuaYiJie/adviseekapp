
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useOpenEndedQuiz } from '@/hooks/useOpenEndedQuiz';
import { QuizCompleted } from './QuizCompleted';
import { QuizWelcome } from './QuizWelcome';
import { QuizInstructions } from './QuizInstructions';

export const OpenEndedQuiz = () => {
  const [showQuestions, setShowQuestions] = useState(false);
  const { 
    loading, 
    completed, 
    setCompleted, 
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

  if (!showQuestions) {
    return <QuizWelcome onStartQuiz={() => setShowQuestions(true)} />;
  }

  return <QuizInstructions onStartQuiz={handleStartQuiz} />;
};
