
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyResume } from "./MyResume";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { LockIcon, ChevronRightIcon, InfoIcon } from "lucide-react";
import { McqQuestionsDisplay } from "@/components/McqQuestionsDisplay";
import { 
  calculateRiasecScores, 
  calculateWorkValueScores, 
  getTopComponents, 
  riasecDescriptions, 
  workValueDescriptions 
} from "@/utils/quizQuestions";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { MajorRecommendations } from "./MajorRecommendations";

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

// Type for chart data
interface ChartDataItem {
  name: string;
  value: number;
  description: string;
  color: string;
}

// Colors for charts
const CHART_COLORS = [
  "#9b87f5", // Primary Purple
  "#8B5CF6", // Vivid Purple
  "#D946EF", // Magenta Pink
  "#F97316", // Bright Orange
  "#0EA5E9", // Ocean Blue
  "#33C3F0", // Sky Blue
];

export const AboutMe = () => {
  const { isCurrentlyDark } = useTheme();
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScores, setQuizScores] = useState<QuizScores>({});
  const [topRiasec, setTopRiasec] = useState<PersonalityComponent[]>([]);
  const [topWorkValues, setTopWorkValues] = useState<PersonalityComponent[]>([]);
  const [riasecChartData, setRiasecChartData] = useState<ChartDataItem[]>([]);
  const [workValuesChartData, setWorkValuesChartData] = useState<ChartDataItem[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
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
    
    // Calculate top RIASEC components and chart data
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
      
      // Calculate RIASEC scores
      const riasecScores = calculateRiasecScores();
      setTopRiasec(getTopComponents(riasecScores));
      
      // Create RIASEC chart data
      const hasRiasecData = Object.values(riasecScores).some(score => score.count > 0);
      if (hasRiasecData) {
        const chartData: ChartDataItem[] = Object.entries(riasecScores)
          .filter(([_, data]) => data.count > 0)
          .map(([component, data], index) => ({
            name: riasecDescriptions[component]?.title || component,
            value: data.average * 20, // Convert to percentage (0-100)
            description: riasecDescriptions[component]?.description || "",
            color: CHART_COLORS[index % CHART_COLORS.length]
          }));
        setRiasecChartData(chartData);
      }
      
      // Calculate Work Values scores
      const workValueScores = calculateWorkValueScores();
      setTopWorkValues(getTopComponents(workValueScores));
      
      // Create Work Values chart data
      const hasWorkValueData = Object.values(workValueScores).some(score => score.count > 0);
      if (hasWorkValueData) {
        const chartData: ChartDataItem[] = Object.entries(workValueScores)
          .filter(([_, data]) => data.count > 0)
          .map(([component, data], index) => ({
            name: workValueDescriptions[component]?.title || component,
            value: data.average * 20, // Convert to percentage (0-100)
            description: workValueDescriptions[component]?.description || "",
            color: CHART_COLORS[index % CHART_COLORS.length]
          }));
        setWorkValuesChartData(chartData);
      }
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

  // Custom tooltip component for the pie charts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-3 rounded-md shadow-lg ${isCurrentlyDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}>
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">{Math.round(data.value)}%</p>
          <p className="text-xs mt-1 max-w-xs">{data.description}</p>
        </div>
      );
    }
    return null;
  };

  // Render a pie chart with the provided data
  const renderPieChart = (title: string, data: ChartDataItem[], empty: boolean) => (
    <div className="flex-1 flex flex-col items-center">
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      
      <div className="w-full h-[240px] mb-4">
        {empty ? (
          <div className={`w-full h-full rounded-lg flex items-center justify-center ${isCurrentlyDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
            <div className="text-center px-4">
              <InfoIcon className="w-8 h-8 mx-auto mb-2 opacity-70" />
              <p>Complete quizzes to see your {title.toLowerCase()} profile</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                innerRadius={30}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      
      {!empty && data.length > 0 && (
        <div className="w-full mt-2 px-4">
          {data.slice(0, 3).map((item) => (
            <div key={item.name} className="mb-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{item.name}</span>
                <span>{Math.round(item.value)}%</span>
              </div>
              <Progress 
                value={item.value} 
                className="h-1 mt-1"
                style={{ backgroundColor: isCurrentlyDark ? '#374151' : '#f3f4f6' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Toggle recommendations visibility
  const handleToggleRecommendations = () => {
    setShowRecommendations(prev => !prev);
  };

  // Check if we can show recommendations (have enough data)
  const canShowRecommendations = topRiasec.length >= 3 && topWorkValues.length >= 3;

  return (
    <div className="w-full h-full space-y-6">
      <Tabs defaultValue="profile" className="w-full h-full">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="profile">About Me</TabsTrigger>
          <TabsTrigger value="explorer">Questions Explorer</TabsTrigger>
          <TabsTrigger value="resume">My Resume</TabsTrigger>
          {canShowRecommendations && (
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="profile" className="w-full space-y-6">
          <div className={`p-6 ${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow w-full`}>
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
                  {renderPieChart(
                    "Personality", 
                    riasecChartData, 
                    riasecChartData.length === 0
                  )}
                  
                  {renderPieChart(
                    "Values", 
                    workValuesChartData, 
                    workValuesChartData.length === 0
                  )}
                </div>
                
                {canShowRecommendations && (
                  <div className="mt-8 flex justify-center">
                    <Button onClick={handleToggleRecommendations}>
                      {showRecommendations ? "Hide Recommendations" : "View Major Recommendations"}
                    </Button>
                  </div>
                )}
                
                {showRecommendations && canShowRecommendations && (
                  <div className="mt-6">
                    <MajorRecommendations 
                      topRiasec={topRiasec} 
                      topWorkValues={topWorkValues} 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="explorer" className="w-full h-full">
          <McqQuestionsDisplay />
        </TabsContent>
        
        <TabsContent value="resume" className="w-full h-full">
          <MyResume />
        </TabsContent>
        
        {canShowRecommendations && (
          <TabsContent value="recommendations" className="w-full h-full">
            <div className={`p-6 ${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow w-full`}>
              <h2 className="text-2xl font-medium mb-4">Your Major Recommendations</h2>
              <MajorRecommendations 
                topRiasec={topRiasec} 
                topWorkValues={topWorkValues} 
              />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
