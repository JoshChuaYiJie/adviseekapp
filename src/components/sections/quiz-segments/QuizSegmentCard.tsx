
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LockIcon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export type QuizSegment = {
  id: string;
  title: string;
  description: string;
  locked?: boolean;
  completed?: boolean;
};

interface QuizSegmentCardProps {
  segment: QuizSegment;
  onStartQuiz: (segmentId: string) => void;
  refreshing: boolean;
}

export const QuizSegmentCard = ({ segment, onStartQuiz, refreshing }: QuizSegmentCardProps) => {
  const { isCurrentlyDark } = useTheme();

  return (
    <div className={`p-6 ${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow`}>
      <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
        <h2 className="text-2xl font-medium">{segment.title}</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg">
          {segment.description}
        </p>
        
        {segment.locked ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <LockIcon size={24} className="text-gray-500 dark:text-gray-400" />
            </div>
            <Alert className={`${isCurrentlyDark ? 'bg-gray-700' : 'bg-gray-100'} max-w-md`}>
              <AlertTitle>This section is locked</AlertTitle>
              <AlertDescription>
                Complete all previous quiz segments to unlock open-ended questions.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            {segment.completed ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 text-3xl">✓</span>
                </div>
                <p className="text-green-600 dark:text-green-400">You've completed this section!</p>
                <Button 
                  variant="outline" 
                  onClick={() => onStartQuiz(segment.id)}
                  disabled={refreshing}
                >
                  {refreshing ? "Preparing..." : "Retake Quiz"}
                </Button>
              </div>
            ) : (
              <Button 
                size="lg" 
                onClick={() => onStartQuiz(segment.id)}
                className="px-8"
                disabled={refreshing}
              >
                {refreshing ? "Preparing..." : "Start Quiz"}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
