
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeepseekOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
  onStreamChunk?: (chunk: string) => void;
}

interface UseDeepseekReturn {
  callAI: (prompt: string) => Promise<string>;
  streamAI: (prompt: string, callback: (chunk: string) => void) => Promise<void>;
  callDeepseek: (prompt: string, options?: DeepseekOptions) => Promise<any>;
  isLoading: boolean;
  loading: boolean; // Alias for isLoading for backward compatibility
  error: string | null;
  streamingText: string;
  isStreaming: boolean;
  cancelStream: () => void;
}

export function useDeepseek(options: DeepseekOptions = {}): UseDeepseekReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  useEffect(() => {
    // Cleanup function to abort any pending requests when component unmounts
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, []);

  const cancelStream = () => {
    if (abortController) {
      abortController.abort();
      setIsStreaming(false);
      setIsLoading(false);
    }
  };

  // Main callDeepseek function that handles both streaming and non-streaming requests
  const callDeepseek = async (prompt: string, customOptions: DeepseekOptions = {}) => {
    setIsLoading(true);
    setError(null);
    
    const finalOptions = {
      ...options,
      ...customOptions,
      stream: false // Force stream to false to revert to non-streaming behavior
    };
    
    try {
      // Non-streaming request
      const { data, error } = await supabase.functions.invoke('deepseek-call', {
        body: { 
          prompt,
          options: finalOptions
        }
      });

      if (error) {
        toast.error('AI Error', {
          description: error.message || 'Failed to call AI'
        });
        throw new Error(error.message || 'Failed to call AI');
      }

      setIsLoading(false);
      
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while calling the AI';
      setError(errorMessage);
      console.error('Error calling DeepSeek AI:', err);
      toast.error('AI Error', {
        description: errorMessage
      });
      
      setIsLoading(false);
      setIsStreaming(false);
      setAbortController(null);
      
      return { choices: [{ message: { content: '' } }] };
    }
  };

  // Legacy method for non-streaming
  const callAI = async (prompt: string): Promise<string> => {
    try {
      const data = await callDeepseek(prompt, { stream: false });
      
      if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from AI');
      }

      return data.choices[0].message.content;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while calling the AI';
      setError(errorMessage);
      console.error('Error calling DeepSeek AI:', err);
      toast.error('AI Error', {
        description: errorMessage
      });
      return '';
    }
  };

  // Legacy method for streaming, but now just calls regular callAI
  const streamAI = async (prompt: string, callback: (chunk: string) => void): Promise<void> => {
    try {
      const response = await callAI(prompt);
      // Call the callback with the full response instead of streaming
      callback(response);
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while calling the AI';
      setError(errorMessage);
      console.error('Error calling DeepSeek AI:', err);
      toast.error('AI Error', {
        description: errorMessage
      });
    }
  };

  return {
    callAI,
    streamAI,
    callDeepseek,
    isLoading,
    loading: isLoading, // Alias for backward compatibility
    error,
    streamingText,
    isStreaming,
    cancelStream
  };
}

export default useDeepseek;
