
import { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';

export const useCompletedQuizzes = (userId: string | null) => {
  const [completedSegments, setCompletedSegments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
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
  
  useEffect(() => {
    const fetchCompletions = async () => {
      setLoading(true);
      let completed: string[] = [];
      
      if (userId) {
        // Try to get from Supabase first
        try {
          const { data, error } = await supabase
            .from('quiz_completion')
            .select('quiz_type')
            .eq('user_id', userId);
            
          if (error) {
            console.error('Error fetching quiz completions:', error);
            // Fallback to localStorage
            completed = getCompletedSegmentsFromLocalStorage();
          } else if (data) {
            completed = data.map(item => item.quiz_type);
            console.log("Fetched completed quiz segments:", completed);
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
    
    fetchCompletions();
  }, [userId]);
  
  // Check if all required segments are completed
  const allSegmentsCompleted = ["interest-part 1", "interest-part 2", "competence", "work-values"].every(
    segment => completedSegments.includes(segment)
  );
  
  return { completedSegments, loading, allSegmentsCompleted, fetchCompletedQuizzes };
};
