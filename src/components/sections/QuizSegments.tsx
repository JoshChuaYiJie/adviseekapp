import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/contexts/ThemeContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LockIcon } from "lucide-react";
import { McqQuestionsDisplay } from "@/components/McqQuestionsDisplay";
import { MajorRecommendations } from "./MajorRecommendations";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("interest-part 1");
  const [userId, setUserId] = useState<string | null>(null);
  const [completedSegments, setCompletedSegments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  // New state for open-ended questions mode
  const [showOpenEndedQuiz, setShowOpenEndedQuiz] = useState(false);
  // State for user's RIASEC and Work Value profiles
  const [riasecProfile, setRiasecProfile] = useState<Array<{ component: string; average: number; score: number }>>([]);
  const [workValueProfile, setWorkValueProfile] = useState<Array<{ component: string; average: number; score: number }>>([]);
  
  // Function to load user profiles
  const loadUserProfiles = async (userId: string) => {
    try {
      console.log("Loading user profiles for", userId);
      
      // Fetch RIASEC profile from user_responses table
      const { data: riasecData, error: riasecError } = await supabase
        .from('user_responses')
        .select('component, score')
        .eq('user_id', userId)
        .eq('quiz_type', 'riasec');
      
      if (riasecError) {
        console.error('Error fetching RIASEC profile:', riasecError);
      } else {
        console.log("RIASEC data:", riasecData);
        if (riasecData && riasecData.length > 0) {
          // Transform data to match expected format with average property
          // Then sort by score in descending order to get highest percentages first
          const transformedData = riasecData
            .map(item => ({
              component: item.component,
              score: item.score,
              average: item.score // Use score as average for compatibility
            }))
            .sort((a, b) => b.score - a.score); // Sort by score descending
            
          console.log("Transformed RIASEC data:", transformedData);
          setRiasecProfile(transformedData);
        }
      }
      
      // Fetch Work Value profile from user_responses table
      const { data: workValueData, error: workValueError } = await supabase
        .from('user_responses')
        .select('component, score')
        .eq('user_id', userId)
        .eq('quiz_type', 'work_value');
      
      if (workValueError) {
        console.error('Error fetching Work Value profile:', workValueError);
      } else {
        console.log("Work Value data:", workValueData);
        if (workValueData && workValueData.length > 0) {
          // Transform data to match expected format with average property
          // Then sort by score in descending order to get highest percentages first
          const transformedData = workValueData
            .map(item => ({
              component: item.component,
              score: item.score,
              average: item.score // Use score as average for compatibility
            }))
            .sort((a, b) => b.score - a.score); // Sort by score descending
            
          console.log("Transformed Work Value data:", transformedData);
          setWorkValueProfile(transformedData);
        }
      }
      
    } catch (error) {
      console.error('Error loading user profiles:', error);
    }
  };
  
  useEffect(() => {
    // Check for authenticated user
    const checkAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || null;
      setUserId(currentUserId);
      
      // Get completed segments
      let completed: string[] = [];
      
      if (currentUserId) {
        // Load user profiles for RIASEC and Work Values
        await loadUserProfiles(currentUserId);
        
        // Try to get from Supabase first
        try {
          // Direct supabase client call since this table isn't in the types yet
          const { data, error } = await supabase
            .from('quiz_completion')
            .select('quiz_type')
            .eq('user_id', currentUserId);
            
          if (error) {
            console.error('Error fetching quiz completions:', error);
            // Fallback to localStorage
            completed = getCompletedSegmentsFromLocalStorage();
          } else if (data) {
            completed = data.map(item => item.quiz_type);
            console.log("Completed quiz segments from database:", completed);
            // Update localStorage for consistency
            localStorage.setItem('completed_quiz_segments', JSON.stringify(completed));
          }
        } catch (err) {
          console.error('Error checking completed quizzes:', err);
          // Fallback to localStorage
          completed = getCompletedSegmentsFromLocalStorage();
        }
      } else {
        // Not logged in, use localStorage
        completed = getCompletedSegmentsFromLocalStorage();
      }
      
      setCompletedSegments(completed);
      setLoading(false);
    };
    
    checkAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id || null;
      setUserId(newUserId);
      
      // If user just logged in, fetch their completed quizzes and profiles
      if (event === 'SIGNED_IN' && session?.user?.id) {
        fetchCompletedQuizzes(session.user.id);
        loadUserProfiles(session.user.id);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Get completed segments from localStorage
  const getCompletedSegmentsFromLocalStorage = () => {
    const completed = localStorage.getItem("completed_quiz_segments");
    return completed ? JSON.parse(completed) : [];
  };
  
  // Fetch completed quizzes from Supabase
  const fetchCompletedQuizzes = async (userId: string) => {
    try {
      // Direct supabase client call since this table isn't in the types yet
      const { data, error } = await supabase
        .from('quiz_completion')
        .select('quiz_type')
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error fetching quiz completions:', error);
        return;
      }
      
      if (data) {
        const completed = data.map(item => item.quiz_type);
        console.log("Fetched completed quiz segments:", completed);
        setCompletedSegments(completed);
        // Update localStorage for consistency
        localStorage.setItem('completed_quiz_segments', JSON.stringify(completed));
      }
    } catch (err) {
      console.error('Error fetching completed quizzes:', err);
    }
  };
  
  // Check if all required segments are completed
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
    if (!userId) {
      toast({
        title: "Not Logged In",
        description: "Please log in to save your quiz progress across devices.",
        variant: "default"
      });
    }
    
    if (segmentId === "open-ended") {
      console.log("Open-ended quiz requested. Profiles:", {
        riasecProfile: riasecProfile,
        workValueProfile: workValueProfile,
        allSegmentsCompleted
      });
      
      // Allow access to open-ended quiz as long as all segments are completed
      if (!allSegmentsCompleted) {
        toast({
          title: "Profile Not Complete",
          description: "Please complete the other quiz segments first to generate your profile.",
          variant: "default" 
        });
        return;
      }
      
      // Show open-ended quiz interface with actual user data
      setShowOpenEndedQuiz(true);
      setActiveTab("open-ended");
    } else {
      navigate(`/quiz/${segmentId}`);
    }
  };

  const isExploreTab = activeTab === "explore";
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue={activeTab} 
        onValueChange={(newTab) => {
          setActiveTab(newTab);
          // Reset open-ended quiz mode if changing tabs
          if (newTab !== "open-ended") {
            setShowOpenEndedQuiz(false);
          }
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
            {segment.id === "open-ended" && showOpenEndedQuiz ? (
              // Show the MajorRecommendations component in quiz mode when open-ended tab is active
              <div>
                <Button 
                  onClick={() => setShowOpenEndedQuiz(false)}
                  variant="outline"
                  className="mb-4"
                >
                  Back to Quiz Overview
                </Button>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg mb-6">
                  <h3 className="font-medium text-lg">Open-ended Questions Quiz</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Select a major from the recommendations below to answer questions specific to that field of study.
                  </p>
                </div>
                
                <MajorRecommendations 
                  topRiasec={riasecProfile.length > 0 ? riasecProfile : [
                    { component: 'Social', average: 4, score: 4 },
                    { component: 'Investigative', average: 3.5, score: 3.5 },
                    { component: 'Artistic', average: 3, score: 3 },
                  ]} 
                  topWorkValues={workValueProfile.length > 0 ? workValueProfile : [
                    { component: 'Achievement', average: 4, score: 4 },
                    { component: 'Recognition', average: 3.5, score: 3.5 },
                    { component: 'Independence', average: 3, score: 3 },
                  ]}
                  isQuizMode={true}
                />
              </div>
            ) : (
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
            )}
          </TabsContent>
        ))}

        <TabsContent value="explore" className="space-y-6">
          <McqQuestionsDisplay />
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
  );
};
