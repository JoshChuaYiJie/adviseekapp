
import { useState, useCallback } from 'react';
import { inspectResponses } from '@/contexts/quiz/utils/databaseHelpers';
import { useToast } from './use-toast';

// Update the type to match the function implementation
export function useQuizDebug() {
  const [isLoading, setIsLoading] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);
  const { toast } = useToast();
  
  const fetchUserResponses = useCallback(async (userId: string | null, pattern?: 'RIASEC' | 'WorkValues' | 'All') => {
    if (!userId) {
      toast({
        title: "Debug error",
        description: "User ID is required to fetch responses",
        variant: "destructive",
      });
      return [];
    }
    
    try {
      setIsLoading(true);
      const data = await inspectResponses(userId, pattern);
      setResponses(data);
      
      if (data.length === 0) {
        toast({
          title: "No responses found",
          description: pattern 
            ? `No responses matching pattern "${pattern}" found`
            : "No responses found for this user",
          variant: "default",
        });
      } else {
        toast({
          title: "Responses loaded",
          description: `Found ${data.length} responses`,
          variant: "default",
        });
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching responses:", error);
      toast({
        title: "Debug error",
        description: `Failed to fetch responses: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  return {
    isLoading,
    responses,
    fetchUserResponses,
  };
}
