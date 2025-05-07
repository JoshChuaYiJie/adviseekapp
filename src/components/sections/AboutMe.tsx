
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
                <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-md space-y-8">
                  {/* Raw quiz scores section */}
                  {Object.keys(quizScores).length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Quiz Results</h3>
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
                    </div>
                  )}

                  {/* RIASEC Personality section */}
                  {topRiasec.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold mb-4">Your Personality Traits (RIASEC)</h3>
                      <div className="space-y-6">
                        {topRiasec.map(({ component, score }) => (
                          <div key={component} className="bg-white dark:bg-gray-800 p-4 rounded-md shadow">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-lg font-medium">
                                {component}: {riasecDescriptions[component]?.title || component}
                              </h4>
                              <span className="text-sm font-semibold bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                                {score}%
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                              {riasecDescriptions[component]?.description || "No description available."}
                            </p>
                            <Progress value={score} className="h-2 mt-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Work Values section */}
                  {topWorkValues.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold mb-4">Your Core Work Values</h3>
                      <div className="space-y-6">
                        {topWorkValues.map(({ component, score }) => (
                          <div key={component} className="bg-white dark:bg-gray-800 p-4 rounded-md shadow">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-lg font-medium">
                                {workValueDescriptions[component]?.title || component}
                              </h4>
                              <span className="text-sm font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                {score}%
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                              {workValueDescriptions[component]?.description || "No description available."}
                            </p>
                            <Progress value={score} className="h-2 mt-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show a message if no personality profiles have been generated */}
                  {quizCompleted && topRiasec.length === 0 && topWorkValues.length === 0 && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-md">
                      <p className="text-center">
                        Quiz data has been recorded, but your personality profile couldn't be generated.
                        This might happen if the quiz questions don't have associated personality components.
                      </p>
                    </div>
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
