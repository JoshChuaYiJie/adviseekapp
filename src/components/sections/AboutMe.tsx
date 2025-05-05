
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyResume } from "./MyResume";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { QuizSegments } from "./QuizSegments";

export const AboutMe = () => {
  const { isCurrentlyDark } = useTheme();
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScores, setQuizScores] = useState<Record<string, number>>({});
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if any quiz segments are completed
    const completedSegments = JSON.parse(localStorage.getItem("completed_quiz_segments") || "[]");
    setQuizCompleted(completedSegments.length > 0);
    
    // Load quiz scores for display
    const scores: Record<string, number> = {};
    
    ['interest-part1', 'interest-part2', 'competence', 'work-values'].forEach(segment => {
      const totalScore = localStorage.getItem(`quiz_total_score_${segment}`);
      if (totalScore) {
        scores[segment] = parseInt(totalScore);
      }
    });
    
    setQuizScores(scores);
  }, []);
  
  const handleTakeQuiz = () => {
    // Redirect to the pickAI page
    navigate("/pickAI");
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
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold">Quiz Scores</h3>
                      {Object.entries(quizScores).map(([segment, score]) => (
                        <div key={segment} className="flex justify-between items-center">
                          <span className="capitalize">{segment.replace('-', ' ')}</span>
                          <span className="font-medium">{score} points</span>
                        </div>
                      ))}
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
