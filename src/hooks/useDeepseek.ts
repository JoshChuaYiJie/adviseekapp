
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface DeepseekOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
}

interface UseDeepseekReturn {
  callAI: (prompt: string) => Promise<string>;
  streamAI: (prompt: string, callback: (chunk: string) => void) => Promise<void>;
  isLoading: boolean;
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

  const callAI = async (prompt: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('deepseek-call', {
        body: { 
          prompt,
          options: {
            ...options,
            stream: false
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to call AI');
      }

      if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from AI');
      }

      return data.choices[0].message.content;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while calling the AI';
      setError(errorMessage);
      console.error('Error calling DeepSeek AI:', err);
      toast({
        title: 'AI Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  const streamAI = async (prompt: string, callback: (chunk: string) => void): Promise<void> => {
    setIsLoading(true);
    setIsStreaming(true);
    setError(null);
    setStreamingText('');

    // Create a new abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const { data, error } = await supabase.functions.invoke('deepseek-call', {
        body: { 
          prompt,
          options: {
            ...options,
            stream: true
          }
        },
        responseType: 'stream',
        abortSignal: controller.signal,
      });

      if (error) {
        throw new Error(error.message || 'Failed to call AI');
      }

      if (!data) {
        throw new Error('No data received from stream');
      }

      const reader = data.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Process the chunk data
        const chunk = decoder.decode(value, { stream: true });
        
        // Split by "data: " to get individual SSE messages
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
        
        for (const line of lines) {
          try {
            const cleanedLine = line.replace(/^data: /, '');
            
            // Skip "[DONE]" message
            if (cleanedLine.trim() === '[DONE]') continue;
            
            const json = JSON.parse(cleanedLine);
            
            if (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content) {
              const textChunk = json.choices[0].delta.content;
              fullText += textChunk;
              setStreamingText(fullText);
              callback(textChunk);
            }
          } catch (parseError) {
            console.warn('Error parsing SSE message:', parseError, line);
            // Continue processing other chunks even if one fails
          }
        }
      }

      return;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted by user');
      } else {
        const errorMessage = err.message || 'An error occurred while streaming AI response';
        setError(errorMessage);
        console.error('Error streaming from DeepSeek AI:', err);
        toast({
          title: 'AI Streaming Error',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setAbortController(null);
    }
  };

  return {
    callAI,
    streamAI,
    isLoading,
    error,
    streamingText,
    isStreaming,
    cancelStream
  };
}

export default useDeepseek;
