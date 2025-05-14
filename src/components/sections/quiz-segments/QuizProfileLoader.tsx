
import { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type UserProfile = {
  component: string;
  average: number;
  score: number;
}[];

interface QuizProfileLoaderProps {
  userId: string | null;
  setRiasecProfile: (profile: UserProfile) => void;
  setWorkValueProfile: (profile: UserProfile) => void;
  setRefreshing: (refreshing: boolean) => void;
}

export const useQuizProfileLoader = ({ 
  userId,
  setRiasecProfile,
  setWorkValueProfile,
  setRefreshing
}: QuizProfileLoaderProps) => {
  const { toast } = useToast();
  
  const loadUserProfiles = async () => {
    if (!userId) return;
    
    try {
      console.log("Loading user profiles for", userId);
      setRefreshing(true);
      
      // Fetch RIASEC profile from user_responses table
      const { data: riasecData, error: riasecError } = await supabase
        .from('user_responses')
        .select('component, score')
        .eq('user_id', userId)
        .eq('quiz_type', 'riasec');
      
      if (riasecError) {
        console.error('Error fetching RIASEC profile:', riasecError);
        toast({
          title: "Error loading profile data",
          description: "Failed to load your RIASEC profile data",
          variant: "destructive"
        });
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
      
      // Fetch Work Value profile from user_responses table with added detailed logging
      const { data: workValueData, error: workValueError } = await supabase
        .from('user_responses')
        .select('component, score')
        .eq('user_id', userId)
        .eq('quiz_type', 'work_value');
      
      if (workValueError) {
        console.error('Error fetching Work Value profile:', workValueError);
        toast({
          title: "Error loading profile data",
          description: "Failed to load your Work Value profile data",
          variant: "destructive"
        });
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
      
      // For debugging: Log both profiles after loading
      console.log("Final RIASEC profile state after loading");
      console.log("Final Work Value profile state after loading");
    } catch (error) {
      console.error('Error loading user profiles:', error);
      toast({
        title: "Error",
        description: "Failed to load user profile data",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };
  
  return { loadUserProfiles };
};
