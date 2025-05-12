
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  getMatchingMajors, 
  mapRiasecToCode, 
  mapWorkValueToCode, 
  formCode 
} from '@/utils/recommendation';
import { MajorRecommendationsType } from './types';
import { processRiasecData } from '@/components/sections/RiasecChart';
import { processWorkValuesData } from '@/components/sections/WorkValuesChart';
import { Info } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);

  // Log the input arrays for debugging
  console.log("RecommendationLogic - Input topRiasec:", topRiasec);
  console.log("RecommendationLogic - Input topWorkValues:", topWorkValues);

  useEffect(() => {
    const getRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get user ID for database operations
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id;
        setUserId(currentUserId || null);
        
        // Log whether we have a current user ID
        console.log("RecommendationLogic - User ID:", currentUserId || "No user ID available");
        
        let generatedRiasecCode: string = '';
        let generatedWorkValueCode: string = '';
        let dataFromCharts = false;
        
        // Try to get data from charts first (most reliable source)
        if (currentUserId) {
          console.log("RecommendationLogic - Trying to fetch from charts data");
          
          // Get the same data that's used in the charts
          const riasecChartData = await processRiasecData(currentUserId);
          const workValuesChartData = await processWorkValuesData(currentUserId);
          
          console.log("RecommendationLogic - RIASEC chart data:", riasecChartData);
          console.log("RecommendationLogic - Work Values chart data:", workValuesChartData);
          
          // Check if we have valid chart data
          if (riasecChartData && riasecChartData.length > 0) {
            // Convert chart data format to match the format expected by formCode
            const formattedRiasecData = riasecChartData.map(item => ({
              component: item.name,
              average: 0, // Not needed for code formation
              score: item.value // Use the value from chart data
            }));
            
            generatedRiasecCode = formCode(formattedRiasecData, mapRiasecToCode);
            console.log(`RecommendationLogic - Generated RIASEC code from chart data: ${generatedRiasecCode}`);
            dataFromCharts = true;
          }
          
          // Similar check for work values chart data
          if (workValuesChartData && workValuesChartData.length > 0) {
            // Convert chart data format to match the format expected by formCode
            const formattedWorkValuesData = workValuesChartData.map(item => ({
              component: item.name,
              average: 0, // Not needed for code formation
              score: item.value // Use the value from chart data
            }));
            
            generatedWorkValueCode = formCode(formattedWorkValuesData, mapWorkValueToCode);
            console.log(`RecommendationLogic - Generated Work Values code from chart data: ${generatedWorkValueCode}`);
            dataFromCharts = true;
          }
        }
        
        // If we couldn't get data from charts, try to use provided arrays
        if (!dataFromCharts || !generatedRiasecCode || !generatedWorkValueCode) {
          console.log("RecommendationLogic - Using provided top components as fallback");
          
          // Generate codes from the provided arrays (already sorted by score)
          if (topRiasec && topRiasec.length > 0) {
            generatedRiasecCode = formCode(topRiasec, mapRiasecToCode);
            console.log(`RecommendationLogic - Generated RIASEC code from provided data: ${generatedRiasecCode}`);
          } else {
            console.error("RecommendationLogic - topRiasec array is empty or undefined");
          }
          
          if (topWorkValues && topWorkValues.length > 0) {
            generatedWorkValueCode = formCode(topWorkValues, mapWorkValueToCode);
            console.log(`RecommendationLogic - Generated Work Values code from provided data: ${generatedWorkValueCode}`);
          } else {
            console.error("RecommendationLogic - topWorkValues array is empty or undefined");
          }
        }
        
        // Check if we have valid codes
        if (!generatedRiasecCode || !generatedWorkValueCode) {
          setError("Could not generate profile codes. Please complete all quizzes and try again.");
          setLoading(false);
          toast({
            title: "Profile Data Missing",
            description: "Please complete all quizzes to see your recommendations.",
            variant: "destructive"
          });
          return;
        }
        
        // Set the codes in state
        setRiasecCode(generatedRiasecCode);
        setWorkValueCode(generatedWorkValueCode);
        
        // Log the final codes we're using
        console.log(`RecommendationLogic - Final codes for recommendations - RIASEC: ${generatedRiasecCode}, Work Values: ${generatedWorkValueCode}`);
        
        // Get recommendations based on these codes
        const majorRecs = await getMatchingMajors(generatedRiasecCode, generatedWorkValueCode);
        console.log("RecommendationLogic - Retrieved major recommendations:", majorRecs);
        
        // Check if we got any recommendations
        if (!majorRecs || (!majorRecs.exactMatches?.length && !majorRecs.permutationMatches?.length && 
            !majorRecs.riasecMatches?.length && !majorRecs.workValueMatches?.length)) {
          console.log("RecommendationLogic - No recommendations found for the profile codes");
          setError("No major recommendations found for your profile. Please complete all quizzes or contact support.");
        } else {
          setError(null);
        }
        
        onRecommendationsLoaded(majorRecs);
      } catch (error) {
        console.error('RecommendationLogic - Error getting major recommendations:', error);
        setError("Failed to load major recommendations. Please try again later.");
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
      console.log("RecommendationLogic - No input data provided");
      setLoading(false);
      setError("No profile data available. Please complete all quizzes first.");
    }
  }, [topRiasec, topWorkValues, toast, onRecommendationsLoaded]);

  return {
    loading,
    riasecCode,
    workValueCode,
    userId,
    error
  };
};
