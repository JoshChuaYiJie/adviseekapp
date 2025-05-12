
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useOpenEndedQuiz = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [riasecCompleted, setRiasecCompleted] = useState(false);
  const [workValuesCompleted, setWorkValuesCompleted] = useState(false);

  useEffect(() => {
    const checkQuizCompletionStatus = async () => {
      setLoading(true);
      try {
        // Check user authentication
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id;
        
        if (!currentUserId) {
          toast({
            title: "Not logged in",
            description: "Please log in to check your quiz status",
            variant: "default",
          });
          setLoading(false);
          return;
        }
        
        // Check which quiz segments are completed
        const { data: completions } = await supabase
          .from('quiz_completion')
          .select('quiz_type')
          .eq('user_id', currentUserId);
        
        const completedTypes = completions?.map(c => c.quiz_type) || [];
        console.log("Completed quiz segments:", completedTypes);
        
        // Check if RIASEC-related quizzes are complete
        const isRiasecComplete = 
          completedTypes.includes('interest-part 1') && 
          completedTypes.includes('interest-part 2') && 
          completedTypes.includes('competence');
        
        // Check if Work Values quiz is complete
        const isWorkValuesComplete = completedTypes.includes('work-values');
        
        // Check if Open-ended quiz is complete
        const isOpenEndedComplete = completedTypes.includes('open-ended');
        
        setRiasecCompleted(isRiasecComplete);
        setWorkValuesCompleted(isWorkValuesComplete);
        setCompleted(isOpenEndedComplete);
        
        console.log("Quiz completion status:", {
          riasecCompleted: isRiasecComplete,
          workValuesCompleted: isWorkValuesComplete,
          openEndedCompleted: isOpenEndedComplete
        });
      } catch (error) {
        console.error('Error checking quiz status:', error);
        toast({
          title: "Error",
          description: "Failed to check your quiz status",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    checkQuizCompletionStatus();
  }, [toast]);
  
  // Function to handle starting the quiz (placeholder for now)
  const handleStartQuiz = () => {
    // This would typically navigate to the quiz page or show the first question
    console.log("Starting open-ended quiz...");
    
    if (!riasecCompleted || !workValuesCompleted) {
      toast({
        title: "Cannot Start Quiz",
        description: "Please complete all required quizzes first",
        variant: "destructive",
      });
      return;
    }
    
    // In a real implementation, this might trigger navigating to the quiz
    console.log("Quiz prerequisites met, can proceed with quiz");
  };
  
  return {
    loading,
    completed,
    setCompleted,
    riasecCompleted,
    workValuesCompleted,
    handleStartQuiz
  };
};
