
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { inspectResponses } from '@/contexts/quiz/utils/databaseHelpers';

export const useQuizDebug = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const init = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || null;
      setUserId(currentUserId);
      
      if (!currentUserId) {
        setError('No authenticated user found');
        setIsLoading(false);
        return;
      }
      
      // Default to empty array
      setResponseData([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchResponses = useCallback(async (pattern?: 'RIASEC' | 'WorkValues' | 'All') => {
    if (!userId) {
      setError('No user ID available');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await inspectResponses(userId, pattern);
      setResponseData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching responses');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return {
    isLoading,
    responseData,
    error,
    userId,
    init,
    fetchResponses
  };
};

export default useQuizDebug;
