
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyResume } from "./MyResume";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { QuizSegments } from "./QuizSegments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Type for quiz scores
type QuizScores = Record<string, {
  total: number,
  maxPossible: number,
  percentage: number
}>;

export const AboutMe = () => {
  const { isCurrentlyDark } = useTheme();
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScores, setQuizScores] = useState<QuizScores>({});
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if any quiz segments are completed
    const completedSegments = JSON.parse(localStorage.getItem("completed_quiz_segments") || "[]");
    setQuizCompleted(completedSegments.length > 0);
    
    // Load quiz scores for display
    const scores: QuizScores = {};
    
    const quizTypes = ['interest-part 1', 'interest-part 2', 'competence', 'work-values'];
    
    quizTypes.forEach(segment => {
      // Get scores from localStorage
      const totalScore = localStorage.getItem(`quiz_total_score_${segment}`);
      if (totalScore) {
        const scoreData = JSON.parse(localStorage.getItem(`quiz_scores_${segment}`) || '{}');
        const questionCount = Object.keys(scoreData).length;
        const maxPossible = questionCount * 5; // Max score is 5 per question
        
        scores[segment] = {
          total: parseInt(totalScore),
          maxPossible: maxPossible,
          percentage: maxPossible > 0 ? (parseInt(totalScore) / maxPossible) * 100 : 0
        };
      }
    });
    
    setQuizScores(scores);
  }, []);
  
  const handleTakeQuiz = () => {
    // Redirect to the pickAI page
    navigate("/pickAI");
  };

  // Helper function to get formatted quiz type name
  const formatQuizType = (type: string): string => {
    switch (type) {
      case 'interest-part 1': return 'Interest Part 1';
      case 'interest-part 2': return 'Interest Part 2';
      case 'competence': return 'Competence';
      case 'work-values': return 'Work Values';
      default: return type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">About Me</TabsTrigger>
          <TabsTrigger value="quiz">Quiz Sections</TabsTrigger>
          <TabsTrigger value="resume">My Resume</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <div className={`p-6 ${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow`}>
            {!quizCompleted ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
                <h2 className="text-2xl font-medium">Adviseek AI needs to know more about you in order to provide the best advice</h2>
                <Button size="lg" onClick={handleTakeQuiz} className="px-8">Take Quiz</Button>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg">
                  Take a 50 question quiz, 25 general questions and 25 open ended questions. 
                  It will not take more than 15 minutes.
                </p>
              </div>
            ) : (
              <div className="py-6">
                <h2 className="text-2xl font-medium mb-4">Your Personal Profile</h2>
                <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-md">
                  <p className="mb-4">Based on your quiz answers, we've generated the following profile:</p>
                  
                  {Object.keys(quizScores).length > 0 ? (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold">Quiz Results</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        {Object.entries(quizScores).map(([segment, data]) => (
                          <Card key={segment} className={isCurrentlyDark ? 'bg-gray-800' : 'bg-white'}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">{formatQuizType(segment)}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Score: {data.total} / {data.maxPossible}</span>
                                  <span>{Math.round(data.percentage)}%</span>
                                </div>
                                <Progress value={data.percentage} className="h-2" />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <p className="mt-6 italic text-sm text-gray-500 dark:text-gray-400">
                        A detailed AI-generated summary of your profile based on these scores will be available soon.
                      </p>
                    </div>
                  ) : (
                    <p className="italic">
                      (This is a placeholder for the AI-generated summary based on quiz answers.)
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="quiz">
          <QuizSegments />
        </TabsContent>
        
        <TabsContent value="resume">
          <MyResume />
        </TabsContent>
      </Tabs>
    </div>
  );
};
