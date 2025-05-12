
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  getMatchingMajors, 
  formCode, 
  mapRiasecToCode, 
  mapWorkValueToCode 
} from '@/utils/recommendationUtils';
import { MajorRecommendationsType } from './types';

interface RecommendationLogicProps {
  topRiasec: Array<{ component: string; average: number; score: number }>;
  topWorkValues: Array<{ component: string; average: number; score: number }>;
  onRecommendationsLoaded: (recommendations: MajorRecommendationsType) => void;
}

export const useRecommendationLogic = ({ 
  topRiasec, 
  topWorkValues,
  onRecommendationsLoaded 
}: RecommendationLogicProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Log the input arrays for debugging
  console.log("RecommendationLogic - Input topRiasec:", topRiasec);
  console.log("RecommendationLogic - Input topWorkValues:", topWorkValues);

  // Form RIASEC and Work Value codes based on highest scoring components
  // Ensure we're using the array values in the order they're provided (already sorted by score)
  const riasecCode = formCode(topRiasec, mapRiasecToCode);
  const workValueCode = formCode(topWorkValues, mapWorkValueToCode);

  useEffect(() => {
    const getRecommendations = async () => {
      try {
        setLoading(true);
        console.log(`Getting recommendations for RIASEC: ${riasecCode}, Work Values: ${workValueCode}`);
        const majorRecs = await getMatchingMajors(riasecCode, workValueCode);
        onRecommendationsLoaded(majorRecs);
      } catch (error) {
        console.error('Error getting major recommendations:', error);
        toast({
          title: "Error",
          description: "Failed to load major recommendations",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };

    // If we have valid codes, get recommendations
    if (riasecCode && workValueCode) {
      getRecommendations();
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [riasecCode, workValueCode, toast, onRecommendationsLoaded]);

  return {
    loading,
    riasecCode,
    workValueCode,
    userId
  };
};
