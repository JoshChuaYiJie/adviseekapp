
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
      ...customOptions
    };
    
    try {
      if (finalOptions.stream) {
        setIsStreaming(true);
        
        // Create a new abort controller for this request
        const controller = new AbortController();
        setAbortController(controller);
        
        // Call the deepseek-call function with stream option
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
        
        // If we're streaming but no data handler was provided
        if (!data) {
          toast.error('AI Error', {
            description: 'No data received from stream'
          });
          throw new Error('No data received from stream');
        }
        
        // Process the streaming data
        let fullText = '';

        // The data from Supabase functions is already a text stream
        // We need to manually process it line by line to handle SSE format
        const lines = data.split('\n');
        
        for (const line of lines) {
          // Process SSE format: lines starting with "data: "
          if (line.startsWith('data: ')) {
            try {
              const cleanedLine = line.replace(/^data: /, '');
              
              // Skip "[DONE]" message
              if (cleanedLine.trim() === '[DONE]') continue;
              
              const json = JSON.parse(cleanedLine);
              
              if (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content) {
                const textChunk = json.choices[0].delta.content;
                fullText += textChunk;
                
                if (finalOptions.onStreamChunk) {
                  finalOptions.onStreamChunk(textChunk);
                } else {
                  setStreamingText(fullText);
                }
              }
            } catch (parseError) {
              console.warn('Error parsing SSE message:', parseError, line);
            }
          }
        }
        
        setIsStreaming(false);
        setIsLoading(false);
        setAbortController(null);
        
        return { choices: [{ message: { content: fullText } }] };
        
      } else {
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
      }
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

  // Legacy method for streaming
  const streamAI = async (prompt: string, callback: (chunk: string) => void): Promise<void> => {
    try {
      await callDeepseek(prompt, { 
        stream: true,
        onStreamChunk: callback
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted by user');
      } else {
        const errorMessage = err.message || 'An error occurred while streaming AI response';
        setError(errorMessage);
        console.error('Error streaming from DeepSeek AI:', err);
        toast.error('AI Streaming Error', {
          description: errorMessage
        });
      }
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
