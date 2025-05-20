
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeepseekOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
}

export const useDeepseek = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callDeepseek = async (prompt: string, options?: DeepseekOptions) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Calling Deepseek function with prompt:", prompt);
      
      const { data, error } = await supabase.functions.invoke('deepseek-call', {
        body: { 
          prompt, 
          options: {
            ...(options || {}),
            stream: options?.stream || false // Include streaming option
          }
        },
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || "Error calling Deepseek");
      }

      if (!data) {
        console.error("No data returned from Deepseek function");
        throw new Error("No response data received");
      }

      console.log("Received response from Deepseek:", data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error("Deepseek error:", errorMessage);
      setError(errorMessage);
      
      toast.error("Failed to get a response from AI", {
        description: "Please try again or check your connection.",
        duration: 4000,
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    callDeepseek,
    loading,
    error,
  };
};
