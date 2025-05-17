
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuiz } from "@/contexts/QuizContext";
import { useState } from "react";
import { QuizSegmentCard, QuizSegment } from "./QuizSegmentCard";
import { QuizExplorerTab } from "./QuizExplorerTab";
import { TooltipProvider } from "@/components/ui/tooltip";

interface QuizSegmentsListProps {
  userId: string | null;
  completedSegments: string[];
  allSegmentsCompleted: boolean;
  refreshing: boolean;
  showDisclaimer: boolean;
  setShowDisclaimer: (show: boolean) => void;
}

export const QuizSegmentsList = ({
  userId,
  completedSegments,
  allSegmentsCompleted,
  refreshing,
  showDisclaimer,
  setShowDisclaimer
}: QuizSegmentsListProps) => {
  const { isCurrentlyDark } = useTheme();
  const { resetQuiz, navigateToPath } = useQuiz();
  const [activeTab, setActiveTab] = useState("interest-part 1");
  
  // Enhanced function to handle quiz start/retake with appropriate state reset
  const handleStartQuiz = (segmentId: string) => {
    if (!userId) {
      // Toast is handled in the parent component
      return;
    }
    
    // Reset the quiz state when starting/retaking a quiz
    resetQuiz();
    
    // Fixed redirection for open-ended quiz - directly navigate without disclaimer
    if (segmentId === "open-ended") {
      navigateToPath(`/open-ended`);
    } else {
      navigateToPath(`/quiz/${segmentId}`);
    }
  };
  
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
  
  const isExploreTab = activeTab === "explore";
  
  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Tabs 
          defaultValue={activeTab} 
          onValueChange={(newTab) => {
            setActiveTab(newTab);
          }}
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
              <QuizSegmentCard 
                segment={segment} 
                onStartQuiz={handleStartQuiz} 
                refreshing={refreshing} 
              />
            </TabsContent>
          ))}

          <TabsContent value="explore" className="space-y-6">
            <QuizExplorerTab />
          </TabsContent>
        </Tabs>
        
        {!userId && (
          <Alert className="bg-amber-50 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-200">
            <AlertTitle>Not signed in</AlertTitle>
            <AlertDescription>
              Sign in to save your quiz progress across devices.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </TooltipProvider>
  );
};
