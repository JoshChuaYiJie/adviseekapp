
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/contexts/ThemeContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LockIcon } from "lucide-react";
import { McqQuestionsDisplay } from "@/components/McqQuestionsDisplay";

type QuizSegment = {
  id: string;
  title: string;
  description: string;
  locked?: boolean;
  completed?: boolean;
};

export const QuizSegments = () => {
  const { isCurrentlyDark } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("interest-part 1");
  
  // Get completed segments from localStorage
  const getCompletedSegments = () => {
    const completed = localStorage.getItem("completed_quiz_segments");
    return completed ? JSON.parse(completed) : [];
  };
  
  const completedSegments = getCompletedSegments();
  const allSegmentsCompleted = ["interest-part 1", "interest-part 2", "competence", "work-values"].every(
    segment => completedSegments.includes(segment)
  );
  
  const quizSegments: QuizSegment[] = [
    {
      id: "interest-part 1",
      title: "Interest Part 1",
      description: "Answer questions about your interests in different activities and subjects.",
      completed: completedSegments.includes("interest-part 1")
    },
    {
      id: "interest-part 2",
      title: "Interest Part 2",
      description: "Continue exploring your interests with additional questions.",
      completed: completedSegments.includes("interest-part 2")
    },
    {
      id: "competence",
      title: "Competence",
      description: "Rate your confidence in performing various tasks and activities.",
      completed: completedSegments.includes("competence")
    },
    {
      id: "work-values",
      title: "Work Values",
      description: "Identify what aspects of work are most important to you.",
      completed: completedSegments.includes("work-values")
    },
    {
      id: "open-ended",
      title: "Open-ended Questions",
      description: "Answer questions specific to your chosen field of study.",
      locked: !allSegmentsCompleted,
      completed: completedSegments.includes("open-ended")
    }
  ];
  
  const handleStartQuiz = (segmentId: string) => {
    navigate(`/quiz/${segmentId}`);
  };

  const isExploreTab = activeTab === "explore";
  
  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-4 flex flex-wrap">
          {quizSegments.map(segment => (
            <TabsTrigger 
              key={segment.id} 
              value={segment.id}
              className={segment.completed ? "text-green-500" : ""}
            >
              {segment.title}
              {segment.completed && <span className="ml-2">✓</span>}
            </TabsTrigger>
          ))}
          <TabsTrigger value="explore">
            Questions Explorer
          </TabsTrigger>
        </TabsList>
        
        {quizSegments.map(segment => (
          <TabsContent key={segment.id} value={segment.id} className="space-y-6">
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
                          onClick={() => handleStartQuiz(segment.id)}
                        >
                          Retake Quiz
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        size="lg" 
                        onClick={() => handleStartQuiz(segment.id)}
                        className="px-8"
                      >
                        Start Quiz
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </TabsContent>
        ))}

        <TabsContent value="explore" className="space-y-6">
          <McqQuestionsDisplay />
        </TabsContent>
      </Tabs>
    </div>
  );
};
