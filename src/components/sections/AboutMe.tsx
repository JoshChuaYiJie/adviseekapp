
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyResume } from "./MyResume";
import { useTranslation } from "react-i18next";

export const AboutMe = () => {
  const { isCurrentlyDark } = useTheme();
  const [quizCompleted, setQuizCompleted] = useState(false);
  const { t } = useTranslation();
  
  const handleTakeQuiz = () => {
    // This would be implemented in the future to launch the quiz
    // For now, we'll just set quizCompleted to true after a delay to simulate completing the quiz
    setTimeout(() => {
      setQuizCompleted(true);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">About Me</TabsTrigger>
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
                  <div className="space-y-4">
                    <p className="italic">
                      (This is a placeholder for the AI-generated summary based on quiz answers.)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="resume">
          <MyResume />
        </TabsContent>
      </Tabs>
    </div>
  );
};
