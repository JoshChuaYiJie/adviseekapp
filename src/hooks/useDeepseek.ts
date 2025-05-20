
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeepseekOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
}

interface StreamCallbacks {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: string) => void;
}

export const useDeepseek = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callDeepseek = async (prompt: string, options?: DeepseekOptions, streamCallbacks?: StreamCallbacks) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Calling Deepseek function with prompt:", prompt);
      const isStreaming = options?.stream || false;
      
      if (isStreaming && streamCallbacks) {
        // Handle streaming response
        const { data, error } = await supabase.functions.invoke('deepseek-call', {
          body: { 
            prompt, 
            options: {
              ...(options || {}),
              stream: true
            }
          },
        });

        if (error) {
          console.error("Supabase function error:", error);
          if (streamCallbacks.onError) streamCallbacks.onError(error.message || "Error calling Deepseek");
          throw new Error(error.message || "Error calling Deepseek");
        }

        // For stream handling, we need to process the response data differently
        // as it's coming from the Edge Function as a ReadableStream
        if (data?.body) {
          try {
            const reader = data.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';

            const processStream = async () => {
              let done = false;
              
              while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                
                if (done) break;
                
                const chunkText = decoder.decode(value, { stream: true });
                fullResponse += chunkText;
                
                // Parse the SSE format to extract the content
                const lines = chunkText.split('\n\n');
                
                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const eventData = line.substring(6);
                    if (eventData === '[DONE]') continue;
                    
                    try {
                      const parsedData = JSON.parse(eventData);
                      const content = parsedData.choices?.[0]?.delta?.content;
                      if (content && streamCallbacks.onChunk) {
                        streamCallbacks.onChunk(content);
                      }
                    } catch (e) {
                      console.warn("Error parsing stream chunk:", e);
                    }
                  }
                }
              }
              
              setLoading(false);
              if (streamCallbacks.onComplete) {
                streamCallbacks.onComplete(fullResponse);
              }
              return fullResponse;
            };

            return processStream();
          } catch (streamError) {
            console.error("Stream processing error:", streamError);
            if (streamCallbacks.onError) streamCallbacks.onError("Error processing stream");
            throw new Error("Error processing stream");
          }
        }
      } else {
        // Handle non-streaming response
        const { data, error } = await supabase.functions.invoke('deepseek-call', {
          body: { 
            prompt, 
            options: {
              ...(options || {}),
              stream: false
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
      }
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
      if (!options?.stream) {
        setLoading(false);
      }
    }
  };

  return {
    callDeepseek,
    loading,
    error,
  };
};
