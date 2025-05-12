
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { OpenEndedQuestion } from '@/components/sections/majors/types';

interface ScoredMajorQuestion {
  major: string;
  questions: OpenEndedQuestion[];
  score: number;
}

export const useOpenEndedQuiz = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  // Fetch user authentication status and quiz completion
  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
        }
        
        // Check if user has already completed this quiz
        if (session?.user) {
          const { data: completionData } = await supabase
            .from('quiz_completion')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('quiz_type', 'open-ended')
            .single();
            
          if (completionData) {
            setCompleted(true);
          }
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

  // Handle quiz start
  const handleStartQuiz = () => {
    if (!checkAuth()) return;
    navigate('/quiz/open-ended-questions');
  };

  return {
    loading,
    userId,
    completed,
    setCompleted,
    handleStartQuiz
  };
};
