
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/contexts/ThemeContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LockIcon } from "lucide-react";
import { McqQuestionsDisplay } from "@/components/McqQuestionsDisplay";
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
      setUserId(session?.user?.id || null);
      
      // If user just logged in, fetch their completed quizzes
      if (event === 'SIGNED_IN' && session?.user?.id) {
        fetchCompletedQuizzes(session.user.id);
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
        setCompletedSegments(completed);
        // Update localStorage for consistency
        localStorage.setItem('completed_quiz_segments', JSON.stringify(completed));
      }
    } catch (err) {
      console.error('Error fetching completed quizzes:', err);
    }
  };
  
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
      // Navigate to major recommendations first to select a major
      navigate('/profile');
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
