import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  getMatchingMajors, 
  mapRiasecToCode, 
  mapWorkValueToCode 
} from '@/utils/recommendation';
import { MajorRecommendationsType } from './types';
import { processRiasecData } from '@/components/sections/RiasecChart';
import { processWorkValuesData } from '@/components/sections/WorkValuesChart';

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
  const [riasecCode, setRiasecCode] = useState<string>('');
  const [workValueCode, setWorkValueCode] = useState<string>('');

  // Log the input arrays for debugging
  console.log("RecommendationLogic - Input topRiasec:", topRiasec);
  console.log("RecommendationLogic - Input topWorkValues:", topWorkValues);

  useEffect(() => {
    const getRecommendations = async () => {
      try {
        setLoading(true);
        
        // Get user ID for database operations
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id;
        setUserId(currentUserId || null);
        
        if (!currentUserId) {
          console.log("No user ID available, using provided top components");
          // Use the provided top components as fallback
          
          // Generate codes from the provided arrays (already sorted by score)
          const generatedRiasecCode = topRiasec
            .slice(0, 3)
            .map(item => mapRiasecToCode(item.component))
            .join('');
          
          const generatedWorkValueCode = topWorkValues
            .slice(0, 3)
            .map(item => mapWorkValueToCode(item.component))
            .join('');
          
          setRiasecCode(generatedRiasecCode);
          setWorkValueCode(generatedWorkValueCode);
          
          console.log(`Using provided data: RIASEC: ${generatedRiasecCode}, Work Values: ${generatedWorkValueCode}`);
          
          // Get recommendations based on these codes
          const majorRecs = await getMatchingMajors(generatedRiasecCode, generatedWorkValueCode);
          onRecommendationsLoaded(majorRecs);
        } else {
          console.log("User ID available, fetching from charts data:", currentUserId);
          
          // Get the same data that's used in the charts
          const riasecChartData = await processRiasecData(currentUserId);
          const workValuesChartData = await processWorkValuesData(currentUserId);
          
          console.log("RIASEC chart data:", riasecChartData);
          console.log("Work Values chart data:", workValuesChartData);
          
          // Generate codes from the chart data (already sorted by value)
          const generatedRiasecCode = riasecChartData
            .slice(0, 3)
            .map(item => mapRiasecToCode(item.name))
            .join('');
          
          const generatedWorkValueCode = workValuesChartData
            .slice(0, 3)
            .map(item => mapWorkValueToCode(item.name))
            .join('');
          
          setRiasecCode(generatedRiasecCode);
          setWorkValueCode(generatedWorkValueCode);
          
          console.log(`Using chart data: RIASEC: ${generatedRiasecCode}, Work Values: ${generatedWorkValueCode}`);
          
          // Get recommendations based on these codes
          const majorRecs = await getMatchingMajors(generatedRiasecCode, generatedWorkValueCode);
          onRecommendationsLoaded(majorRecs);
        }
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

    // Check if we have valid inputs to proceed
    if ((topRiasec && topRiasec.length > 0) || (topWorkValues && topWorkValues.length > 0)) {
      getRecommendations();
    } else {
      setLoading(false);
    }
  }, [topRiasec, topWorkValues, toast, onRecommendationsLoaded]);

  return {
    loading,
    riasecCode,
    workValueCode,
    userId
  };
};
