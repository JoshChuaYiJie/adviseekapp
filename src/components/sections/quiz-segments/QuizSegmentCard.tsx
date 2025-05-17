
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LockIcon, RefreshCcwIcon } from "lucide-react";

export interface QuizSegment {
  id: string;
  title: string;
  description: string;
  completed?: boolean;
  locked?: boolean;
}

interface QuizSegmentCardProps {
  segment: QuizSegment;
  onStartQuiz: (segmentId: string) => void;
  refreshing: boolean;
}

export const QuizSegmentCard: React.FC<QuizSegmentCardProps> = ({ segment, onStartQuiz, refreshing }) => {
  const isCompetence = segment.id === "competence";
  const isWorkValues = segment.id === "work-values";
  
  // Get step number for interest parts
  const getStepNumber = () => {
    if (segment.id.startsWith("interest-part")) {
      return segment.id.split("-").pop();
    }
    return null;
  };
  
  const stepNumber = getStepNumber();
  
  const handleStartQuiz = () => {
    if (!segment.locked) {
      onStartQuiz(segment.id);
    }
  };

  const displayStatus = () => {
    if (segment.completed) return "Completed";
    if (segment.locked) return "Locked";
    return "Not Started";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{segment.title}</span>
          <span className={`text-sm ${segment.completed ? "text-green-500" : "text-gray-400"}`}>
            {displayStatus()}
          </span>
        </CardTitle>
        <CardDescription>{segment.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-between items-center">
        {segment.locked ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button disabled className="w-40">
                  <LockIcon className="mr-2 h-4 w-4" />
                  Locked
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Complete all basic quizzes first</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button 
            onClick={handleStartQuiz} 
            variant={segment.completed ? "outline" : "default"}
            disabled={refreshing}
            className="w-40"
          >
            {refreshing ? (
              <RefreshCcwIcon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              segment.completed ? "Retake Quiz" : "Start Quiz"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
