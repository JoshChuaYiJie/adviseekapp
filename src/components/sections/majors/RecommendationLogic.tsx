
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
        
        // Log whether we have a current user ID
        console.log("RecommendationLogic - User ID:", currentUserId || "No user ID available");
        
        let generatedRiasecCode: string;
        let generatedWorkValueCode: string;
        
        if (!currentUserId) {
          console.log("No user ID available, using provided top components");
          // Generate codes from the provided arrays (already sorted by score)
          
          // Make sure topRiasec and topWorkValues aren't empty
          if (!topRiasec || topRiasec.length === 0) {
            console.error("topRiasec array is empty or undefined");
            toast({
              title: "Error",
              description: "RIASEC data is missing. Please complete the RIASEC assessment.",
              variant: "destructive"
            });
            setLoading(false);
            return;
          }
          
          if (!topWorkValues || topWorkValues.length === 0) {
            console.error("topWorkValues array is empty or undefined");
            toast({
              title: "Error",
              description: "Work Values data is missing. Please complete the Work Values assessment.",
              variant: "destructive"
            });
            setLoading(false);
            return;
          }
          
          // Use the formCode function to generate codes
          generatedRiasecCode = formCode(topRiasec, mapRiasecToCode);
          generatedWorkValueCode = formCode(topWorkValues, mapWorkValueToCode);
          
          console.log(`Using provided data to generate codes - RIASEC: ${generatedRiasecCode}, Work Values: ${generatedWorkValueCode}`);
        } else {
          console.log("User ID available, fetching from charts data");
          
          // Get the same data that's used in the charts
          const riasecChartData = await processRiasecData(currentUserId);
          const workValuesChartData = await processWorkValuesData(currentUserId);
          
          console.log("RIASEC chart data:", riasecChartData);
          console.log("Work Values chart data:", workValuesChartData);
          
          // Check if we have chart data
          if (!riasecChartData || riasecChartData.length === 0) {
            console.error("RIASEC chart data is empty or undefined");
            // Fall back to provided topRiasec
            if (topRiasec && topRiasec.length > 0) {
              generatedRiasecCode = formCode(topRiasec, mapRiasecToCode);
              console.log(`Falling back to provided topRiasec data - RIASEC: ${generatedRiasecCode}`);
            } else {
              console.error("No RIASEC data available from any source");
              toast({
                title: "Error",
                description: "RIASEC data is missing. Please complete the RIASEC assessment.",
                variant: "destructive"
              });
              setLoading(false);
              return;
            }
          } else {
            // Convert chart data format to match the format expected by formCode
            const formattedRiasecData = riasecChartData.map(item => ({
              component: item.name,
              average: 0, // Not needed for code formation
              score: item.value // Use the value from chart data
            }));
            
            generatedRiasecCode = formCode(formattedRiasecData, mapRiasecToCode);
            console.log(`Generated RIASEC code from chart data: ${generatedRiasecCode}`);
          }
          
          // Similar check for work values chart data
          if (!workValuesChartData || workValuesChartData.length === 0) {
            console.error("Work Values chart data is empty or undefined");
            // Fall back to provided topWorkValues
            if (topWorkValues && topWorkValues.length > 0) {
              generatedWorkValueCode = formCode(topWorkValues, mapWorkValueToCode);
              console.log(`Falling back to provided topWorkValues data - Work Values: ${generatedWorkValueCode}`);
            } else {
              console.error("No Work Values data available from any source");
              toast({
                title: "Error",
                description: "Work Values data is missing. Please complete the Work Values assessment.",
                variant: "destructive"
              });
              setLoading(false);
              return;
            }
          } else {
            // Convert chart data format to match the format expected by formCode
            const formattedWorkValuesData = workValuesChartData.map(item => ({
              component: item.name,
              average: 0, // Not needed for code formation
              score: item.value // Use the value from chart data
            }));
            
            generatedWorkValueCode = formCode(formattedWorkValuesData, mapWorkValueToCode);
            console.log(`Generated Work Values code from chart data: ${generatedWorkValueCode}`);
          }
        }
        
        // Set the codes in state
        setRiasecCode(generatedRiasecCode);
        setWorkValueCode(generatedWorkValueCode);
        
        // Log the final codes we're using
        console.log(`Final codes for recommendations - RIASEC: ${generatedRiasecCode}, Work Values: ${generatedWorkValueCode}`);
        
        // Get recommendations based on these codes
        const majorRecs = await getMatchingMajors(generatedRiasecCode, generatedWorkValueCode);
        console.log("Retrieved major recommendations:", majorRecs);
        
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
