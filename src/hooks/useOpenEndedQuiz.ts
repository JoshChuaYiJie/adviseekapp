
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const useOpenEndedQuiz = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [riasecCompleted, setRiasecCompleted] = useState(false);
  const [workValuesCompleted, setWorkValuesCompleted] = useState(false);

  // Fetch user authentication status and quiz completion
  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
          console.log("User authenticated:", session.user.id);
          
          // Check quiz completions
          const { data: completions } = await supabase
            .from('quiz_completion')
            .select('quiz_type')
            .eq('user_id', session.user.id);
            
          console.log("Quiz completions:", completions);
          
          // Check if user has completed the open-ended quiz
          const openEndedCompleted = completions?.some(c => c.quiz_type === 'open-ended');
          setCompleted(openEndedCompleted || false);
          
          // Check if user has completed RIASEC and Work Values quizzes
          const riasecSegments = ['interest-part 1', 'interest-part 2', 'competence'];
          const hasRiasec = riasecSegments.every(segment => 
            completions?.some(c => c.quiz_type === segment)
          );
          setRiasecCompleted(hasRiasec);
          
          const hasWorkValues = completions?.some(c => c.quiz_type === 'work-values');
          setWorkValuesCompleted(hasWorkValues);
          
          console.log("Quiz status:", {
            openEnded: openEndedCompleted,
            riasec: hasRiasec,
            workValues: hasWorkValues
          });
        }
      } catch (error) {
        console.error('Error fetching user status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserStatus();
  }, []);

  // Handle authentication check
  const checkAuth = () => {
    if (!userId) {
      toast({
        title: "Not Logged In",
        description: "Please log in to take the quiz.",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  // Check if prerequisites are met
  const checkPrerequisites = () => {
    if (!riasecCompleted) {
      toast({
        title: "Missing RIASEC Profile",
        description: "Please complete the Interest and Competence quizzes first.",
        variant: "destructive"
      });
      return false;
    }
    
    if (!workValuesCompleted) {
      toast({
        title: "Missing Work Values Profile",
        description: "Please complete the Work Values quiz first.",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  // Handle quiz start
  const handleStartQuiz = () => {
    if (!checkAuth()) return;
    if (!checkPrerequisites()) return;
    navigate('/quiz/open-ended-questions');
  };

  return {
    loading,
    userId,
    completed,
    setCompleted,
    riasecCompleted,
    workValuesCompleted,
    handleStartQuiz
  };
};
