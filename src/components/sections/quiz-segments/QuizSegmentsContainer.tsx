
import { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RecommendationDisclaimer } from "@/components/CourseQuiz/RecommendationDisclaimer";
import { QuizSegmentsList } from "./QuizSegmentsList";
import { useCompletedQuizzes } from "./useCompletedQuizzes";
import { useQuizProfileLoader } from "./QuizProfileLoader";

export const QuizSegmentsContainer = () => {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // State for user's RIASEC and Work Value profiles
  const [riasecProfile, setRiasecProfile] = useState<Array<{ component: string; average: number; score: number }>>([]);
  const [workValueProfile, setWorkValueProfile] = useState<Array<{ component: string; average: number; score: number }>>([]);
  
  // State to show the recommendation disclaimer dialog
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  // State to track if data is being refreshed when retaking quizzes
  const [refreshing, setRefreshing] = useState(false);
  
  const { 
    completedSegments, 
    loading: loadingCompletions, 
    allSegmentsCompleted 
  } = useCompletedQuizzes(userId);
  
  const { loadUserProfiles } = useQuizProfileLoader({
    userId,
    setRiasecProfile,
    setWorkValueProfile,
    setRefreshing
  });
  
  useEffect(() => {
    // Check for authenticated user
    const checkAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || null;
      setUserId(currentUserId);
      
      if (currentUserId) {
        // Load user profiles for RIASEC and Work Values
        await loadUserProfiles();
      }
      
      setLoading(false);
    };
    
    checkAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id || null;
      setUserId(newUserId);
      
      // If user just logged in, fetch their completed quizzes and profiles
      if (event === 'SIGNED_IN' && session?.user?.id) {
        loadUserProfiles();
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading || loadingCompletions) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
      </div>
    );
  }
  
  return (
    <>
      <QuizSegmentsList 
        userId={userId}
        completedSegments={completedSegments}
        allSegmentsCompleted={allSegmentsCompleted}
        refreshing={refreshing}
        showDisclaimer={showDisclaimer}
        setShowDisclaimer={setShowDisclaimer}
      />
      
      {/* Add the Recommendation Disclaimer Dialog */}
      <RecommendationDisclaimer 
        isOpen={showDisclaimer} 
        onClose={() => setShowDisclaimer(false)} 
      />
    </>
  );
};
