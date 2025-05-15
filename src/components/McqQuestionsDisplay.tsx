
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { TooltipProvider } from "@/components/ui/tooltip";

export const McqQuestionsDisplay = () => {
  const navigate = useNavigate();
  const [completedQuizParts, setCompletedQuizParts] = useState<string[]>([]);
  
  useEffect(() => {
    // Load completed quiz parts from local storage
    const storedCompletions = localStorage.getItem('completed_quiz_segments');
    if (storedCompletions) {
      try {
        const completions = JSON.parse(storedCompletions);
        setCompletedQuizParts(completions);
      } catch (error) {
        console.error("Error parsing completed quiz segments:", error);
      }
    }
  }, []);
  
  const isQuizPartCompleted = (partNumber: number) => {
    return completedQuizParts.includes(`interest-part ${partNumber}`);
  };
  
  const handleStartQuiz = (partNumber: number) => {
    navigate(`/quiz/interest-part ${partNumber}`);
  };
  
  return (
    <TooltipProvider>
      <div className="space-y-6 p-4">
        <h2 className="text-2xl font-bold">Quiz Explorer</h2>
        
        <p className="text-muted-foreground">
          Complete all four parts of the quiz to get personalized university program recommendations.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuizCard
            title="Interest Assessment (Part 1)"
            description="Identify your preferences and interests in various activities."
            isCompleted={isQuizPartCompleted(1)}
            onStart={() => handleStartQuiz(1)}
          />
          
          <QuizCard
            title="Interest Assessment (Part 2)"
            description="Further explore your interests and preferences."
            isCompleted={isQuizPartCompleted(2)}
            onStart={() => handleStartQuiz(2)}
          />
          
          <QuizCard
            title="Competence Assessment"
            description="Assess your skills and abilities in different areas."
            isCompleted={isQuizPartCompleted(3)}
            onStart={() => handleStartQuiz(3)}
          />
          
          <QuizCard
            title="Work Values Assessment"
            description="Discover what you value most in your future career."
            isCompleted={isQuizPartCompleted(4)}
            onStart={() => handleStartQuiz(4)}
          />
        </div>
        
        <div className="flex justify-center mt-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/recommendations')}
            disabled={!isQuizPartCompleted(1) || !isQuizPartCompleted(2) || !isQuizPartCompleted(3) || !isQuizPartCompleted(4)}
          >
            View My Recommendations
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
};

interface QuizCardProps {
  title: string;
  description: string;
  isCompleted: boolean;
  onStart: () => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ title, description, isCompleted, onStart }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {title}
          {isCompleted && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-green-500 text-white rounded-full text-xs">
              ✓
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{description}</p>
        <Button onClick={onStart}>
          {isCompleted ? "Retake Quiz" : "Start Quiz"}
        </Button>
      </CardContent>
    </Card>
  );
};
