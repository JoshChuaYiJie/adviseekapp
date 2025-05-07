
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyResume } from "./MyResume";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LockIcon, ChevronRightIcon } from "lucide-react";
import { McqQuestionsDisplay } from "@/components/McqQuestionsDisplay";
import { 
  calculateRiasecScores, 
  calculateWorkValueScores, 
  getTopComponents, 
  riasecDescriptions, 
  workValueDescriptions 
} from "@/utils/quizQuestions";

// Type for quiz scores
type QuizScores = Record<string, {
  total: number,
  maxPossible: number,
  percentage: number
}>;

// Type for personality component
interface PersonalityComponent {
  component: string;
  average: number;
  score: number;
}

// Type for quiz segment
type QuizSegment = {
  id: string;
  title: string;
  description: string;
  locked?: boolean;
  completed?: boolean;
};

export const AboutMe = () => {
  const { isCurrentlyDark } = useTheme();
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScores, setQuizScores] = useState<QuizScores>({});
  const [topRiasec, setTopRiasec] = useState<PersonalityComponent[]>([]);
  const [topWorkValues, setTopWorkValues] = useState<PersonalityComponent[]>([]);
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
    
    // Calculate top RIASEC components
    if (completedSegments.length > 0) {
      // Store the quiz questions in localStorage so we can associate them with components
      quizTypes.forEach(async segment => {
        if (!localStorage.getItem(`quiz_questions_${segment}`)) {
          try {
            const response = await fetch(`/quiz_refer/Mcq_questions/${getJsonFilename(segment)}`);
            if (response.ok) {
              const questions = await response.json();
              localStorage.setItem(`quiz_questions_${segment}`, JSON.stringify(questions));
            }
          } catch (error) {
            console.error(`Error fetching ${segment} questions:`, error);
          }
        }
      });
      
      // Calculate and set top components
      const riasecScores = calculateRiasecScores();
      const workValueScores = calculateWorkValueScores();
      
      setTopRiasec(getTopComponents(riasecScores));
      setTopWorkValues(getTopComponents(workValueScores));
    }
  }, []);
  
  // Helper function to get the JSON filename from the quiz type
  const getJsonFilename = (quizType: string): string => {
    switch (quizType) {
      case 'interest-part 1': return 'RIASEC_interest_questions_pt1.json';
      case 'interest-part 2': return 'RIASEC_interest_questions_pt2.json';
      case 'competence': return 'RIASEC_competence_questions.json';
      case 'work-values': return 'Work_value_questions.json';
      default: return '';
    }
  };
  
  const handleTakeQuiz = (segmentId: string) => {
    // Redirect to the quiz page with the specific segment
    navigate(`/quiz/${segmentId}`);
  };

  // Get completed segments from localStorage
  const getCompletedSegments = () => {
    const completed = localStorage.getItem("completed_quiz_segments");
    return completed ? JSON.parse(completed) : [];
  };
  
  const completedSegments = getCompletedSegments();
  const allSegmentsCompleted = ["interest-part 1", "interest-part 2", "competence", "work-values"].every(
    segment => completedSegments.includes(segment)
  );

  // Quiz segments data
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

  // Helper function to render a quiz box
  const renderQuizBox = (segment: QuizSegment) => (
    <div key={segment.id} className={`p-4 rounded-lg border ${isCurrentlyDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm transition-all hover:shadow-md`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-lg flex items-center">
            {segment.title}
            {segment.completed && <span className="ml-2 text-green-500">✓</span>}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{segment.description}</p>
        </div>

        {segment.locked ? (
          <div className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
            <LockIcon size={16} className="text-gray-500 dark:text-gray-400" />
          </div>
        ) : segment.completed ? (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleTakeQuiz(segment.id)}
            className="text-xs"
          >
            Retake
          </Button>
        ) : (
          <Button 
            variant="default" 
            size="sm"
            onClick={() => handleTakeQuiz(segment.id)}
            className="text-xs"
          >
            Take Quiz <ChevronRightIcon size={14} className="ml-1" />
          </Button>
        )}
      </div>
      {segment.completed && (
        <div className="mt-3">
          <div className="flex justify-between text-xs">
            <span>Completed</span>
            <span>100%</span>
          </div>
          <Progress value={100} className="h-1 mt-1" />
        </div>
      )}
    </div>
  );

  // Create a circular chart representation using divs and styling
  const renderProfileChart = (title: string, components: PersonalityComponent[], descriptions: Record<string, { title: string; description: string }>) => (
    <div className="flex-1 flex flex-col items-center">
      <div className={`w-40 h-40 rounded-full ${isCurrentlyDark ? 'bg-gray-800' : 'bg-gray-100'} flex items-center justify-center relative overflow-hidden border ${isCurrentlyDark ? 'border-gray-700' : 'border-gray-200'}`}>
        {components.length > 0 ? (
          components.map((comp, index) => {
            const rotation = index * (360 / components.length);
            const color = index === 0 ? 'bg-purple-500' : index === 1 ? 'bg-blue-500' : 'bg-green-500';
            
            return (
              <div 
                key={comp.component}
                className={`absolute top-0 left-0 w-full h-full ${color} opacity-70`}
                style={{ 
                  clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(rotation * Math.PI / 180)}% ${50 + 50 * Math.sin(rotation * Math.PI / 180)}%, ${50 + 50 * Math.cos((rotation + (360 / components.length)) * Math.PI / 180)}% ${50 + 50 * Math.sin((rotation + (360 / components.length)) * Math.PI / 180)}%)` 
                }}
              />
            );
          })
        ) : (
          <div className="text-center px-4 text-sm text-gray-500 dark:text-gray-400">
            Complete quizzes to see your profile
          </div>
        )}
        <div className={`z-10 w-24 h-24 rounded-full flex items-center justify-center ${isCurrentlyDark ? 'bg-gray-900' : 'bg-white'} text-center`}>
          <span className="font-semibold">{title}</span>
        </div>
      </div>
      
      {components.length > 0 && (
        <div className="mt-4 w-full">
          {components.map((comp) => (
            <div key={comp.component} className="mb-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{descriptions[comp.component]?.title || comp.component}</span>
                <span>{comp.score}%</span>
              </div>
              <Progress value={comp.score} className="h-1 mt-1" />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">About Me</TabsTrigger>
          <TabsTrigger value="explorer">Questions Explorer</TabsTrigger>
          <TabsTrigger value="resume">My Resume</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <div className={`p-6 ${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow`}>
            <div className="py-4">
              <h2 className="text-2xl font-medium mb-4">Your Personal Profile</h2>
              
              <p className="text-md text-center mb-6 text-gray-600 dark:text-gray-300">
                Adviseek AI needs to know more about you in order to provide the best advice. 
                Finish more quizzes for more detailed advice!
              </p>
              
              <div className="grid gap-4 mb-8">
                {quizSegments.map(renderQuizBox)}
              </div>
              
              <div className="mt-10">
                <h3 className="text-xl font-medium mb-6 text-center">Your Profile Summary</h3>
                <div className="flex flex-col md:flex-row gap-8 justify-around">
                  {renderProfileChart("Personality", topRiasec, riasecDescriptions)}
                  {renderProfileChart("Values", topWorkValues, workValueDescriptions)}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="explorer">
          <Card>
            <CardContent className="p-6">
              <McqQuestionsDisplay />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resume">
          <MyResume />
        </TabsContent>
      </Tabs>
    </div>
  );
};
