
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from "@/contexts/ThemeContext";
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const OpenEndedQuiz = () => {
  const { toast } = useToast();
  const { isCurrentlyDark } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);

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

  // Redirect to the open-ended quiz page
  const handleStartQuiz = () => {
    if (!userId) {
      toast({
        title: "Not Logged In",
        description: "Please log in to take the quiz.",
        variant: "destructive"
      });
      return;
    }
    
    navigate('/quiz/open-ended-questions');
  };

  if (completed) {
    return (
      <div className="p-6 bg-green-50 dark:bg-green-900 rounded-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Quiz Completed!</h2>
        <p className="mb-6">Thank you for completing the open-ended questions quiz.</p>
        <Button 
          variant="outline" 
          onClick={() => {
            setCompleted(false);
            setShowQuestions(false);
            navigate('/quiz/open-ended-questions');
          }}
        >
          Retake Quiz
        </Button>
      </div>
    );
  }

  if (!showQuestions) {
    return (
      <div className={`p-6 ${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow`}>
        <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
          <h2 className="text-2xl font-medium">Open-ended Questions</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg">
            Answer questions specific to your interests, skills, and experiences related to potential fields of study.
          </p>
          <Button 
            size="lg" 
            onClick={() => setShowQuestions(true)}
            className="px-8"
          >
            Take Quiz
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg mb-4">
        <h3 className="font-medium text-lg mb-2">Open-ended Questions Quiz</h3>
        <p className="text-gray-600 dark:text-gray-300">
          Answer questions about your interests, skills, and experiences related to potential majors.
          These questions are designed to help you reflect on your academic and career goals.
        </p>
      </div>

      <div className="flex justify-center my-8">
        <Button 
          size="lg"
          onClick={handleStartQuiz}
          className="px-8 bg-blue-600 hover:bg-blue-700"
        >
          Start Quiz
        </Button>
      </div>
    </div>
  );
};
