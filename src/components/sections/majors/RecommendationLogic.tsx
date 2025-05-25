
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
  onRecommendationsLoaded?: (recommendations: MajorRecommendationsType) => void;
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
  const [recommendations, setRecommendations] = useState<MajorRecommendationsType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Log the input arrays for debugging
  
  

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
        
        
        let generatedRiasecCode: string = '';
        let generatedWorkValueCode: string = '';
        let dataFromCharts = false;
        let dataFromUserResponses = false;
        
        
        
        // Try to get data from charts first (most reliable source)
        if (currentUserId) {
          
          
          // Get the same data that's used in the charts
          const riasecChartData = await processRiasecData(currentUserId);
          const workValuesChartData = await processWorkValuesData(currentUserId);
          
          
          
          
          // Check if we have valid chart data
          if (riasecChartData && riasecChartData.length > 0) {
            // Convert chart data format to match the format expected by formCode
            const formattedRiasecData = riasecChartData.map(item => ({
              component: item.name,
              average: 0, // Not needed for code formation
              score: item.value // Use the value from chart data
            }));
            
            generatedRiasecCode = formCode(formattedRiasecData, mapRiasecToCode);
            
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
            
            dataFromCharts = true;
          }
        }
        
        // If charts didn't work, try direct user_responses query
        if ((!dataFromCharts || !generatedRiasecCode || !generatedWorkValueCode) && currentUserId) {
          
          
          // Get RIASEC components from interest and competence quizzes
          const { data: riasecResponses, error: riasecError } = await supabase
            .from('user_responses')
            .select('component, score')
            .eq('user_id', currentUserId)
            .in('quiz_type', ['interest-part 1', 'interest-part 2', 'competence'])
            .not('component', 'is', null);
            
          if (riasecError) {
            console.error('Error fetching RIASEC responses:', riasecError);
          } else if (riasecResponses && riasecResponses.length > 0) {
            
            
            // Group responses by component and sum scores
            const componentScores: Record<string, number> = {};
            riasecResponses.forEach(response => {
              if (response.component) {
                componentScores[response.component] = (componentScores[response.component] || 0) + (response.score || 0);
              }
            });
            
            // Convert to array and sort by score
            const sortedComponents = Object.entries(componentScores)
              .map(([component, score]) => ({ component, score, average: 0 }))
              .sort((a, b) => b.score - a.score);
              
            
            
            if (sortedComponents.length > 0) {
              generatedRiasecCode = formCode(sortedComponents, mapRiasecToCode);
              
              dataFromUserResponses = true;
            }
          }
          
          // Get Work Value components
          const { data: workValueResponses, error: workValueError } = await supabase
            .from('user_responses')
            .select('component, score')
            .eq('user_id', currentUserId)
            .eq('quiz_type', 'work-values')
            .not('component', 'is', null);
            
          if (workValueError) {
            console.error('Error fetching Work Value responses:', workValueError);
          } else if (workValueResponses && workValueResponses.length > 0) {
            
            
            // Group responses by component and sum scores
            const componentScores: Record<string, number> = {};
            workValueResponses.forEach(response => {
              if (response.component) {
                componentScores[response.component] = (componentScores[response.component] || 0) + (response.score || 0);
              }
            });
            
            // Convert to array and sort by score
            const sortedComponents = Object.entries(componentScores)
              .map(([component, score]) => ({ component, score, average: 0 }))
              .sort((a, b) => b.score - a.score);
              
            
            
            if (sortedComponents.length > 0) {
              generatedWorkValueCode = formCode(sortedComponents, mapWorkValueToCode);
              
              dataFromUserResponses = true;
            }
          }
        }
        
        // If still no data, use the provided arrays as fallback
        if ((!dataFromCharts && !dataFromUserResponses) || !generatedRiasecCode || !generatedWorkValueCode) {
          
          
          
          
          // Generate codes from the provided arrays (already sorted by score)
          if (topRiasec && topRiasec.length > 0) {
            generatedRiasecCode = formCode(topRiasec, mapRiasecToCode);
            
          } else {
            // Default fallback: use a generic code
            generatedRiasecCode = 'SAE';
            
          }
          
          if (topWorkValues && topWorkValues.length > 0) {
            generatedWorkValueCode = formCode(topWorkValues, mapWorkValueToCode);
            
          } else {
            // Default fallback: use a generic code
            generatedWorkValueCode = 'ARS';
            
          }
        }

        
        
        
        
        
        // Check if we have valid codes
        if (!generatedRiasecCode || !generatedWorkValueCode) {
          // Use hardcoded fallback codes as last resort
          generatedRiasecCode = generatedRiasecCode || 'SAE';
          generatedWorkValueCode = generatedWorkValueCode || 'ARS';
          console.log("Using fallback codes:", {
            riasec: generatedRiasecCode,
            workValue: generatedWorkValueCode
          });
          
          toast({
            title: "Using Default Profile",
            description: "We couldn't find your complete profile data. Using default recommendations.",
            variant: "default"
          });
        }
        
        // Set the codes in state
        setRiasecCode(generatedRiasecCode);
        setWorkValueCode(generatedWorkValueCode);
        
        // Log the final codes we're using
        
        
        // Get recommendations based on these codes
        const majorRecs = await getMatchingMajors(generatedRiasecCode, generatedWorkValueCode);
        
        
        // Check if we got any recommendations
        if (!majorRecs || (!majorRecs.exactMatches?.length && !majorRecs.permutationMatches?.length && 
            !majorRecs.riasecMatches?.length && !majorRecs.workValueMatches?.length)) {
          
          setError("No major recommendations found for your profile. Please complete all quizzes or contact support.");
        } else {
          setError(null);
        }
        
        setRecommendations(majorRecs);
        
        // Call the callback if provided
        if (onRecommendationsLoaded) {
          onRecommendationsLoaded(majorRecs);
        }
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
    if ((topRiasec && topRiasec.length > 0) || (topWorkValues && topWorkValues.length > 0) || true) {
      getRecommendations();
    } else {
      
      setLoading(false);
      setError("No profile data available. Please complete all quizzes first.");
    }
  }, [topRiasec, topWorkValues, toast, onRecommendationsLoaded]);

  return {
    loading,
    riasecCode,
    workValueCode,
    userId,
    error,
    recommendations
  };
};
