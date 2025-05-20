
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeepseekOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
  onStreamChunk?: (chunk: string) => void;
}

export const useDeepseek = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callDeepseek = async (prompt: string, options?: DeepseekOptions) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Calling Deepseek function with prompt:", prompt);
      
      // Check if streaming is enabled
      if (options?.stream && options?.onStreamChunk) {
        console.log("Streaming mode enabled");
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Authentication required");
        
        // Setup direct streaming fetch
        try {
          // Make a direct fetch to the edge function for streaming
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deepseek-call`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              prompt,
              options: {
                ...(options || {}),
                stream: true
              }
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Stream response error:", errorText);
            throw new Error(`Failed to stream response: ${response.status} ${errorText}`);
          }

          // Process the stream
          const reader = response.body?.getReader();
          if (!reader) throw new Error("Failed to get stream reader");

          let accumulatedContent = '';
          let decoder = new TextDecoder();
          
          // Process stream chunks
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Convert the Uint8Array to text
            const chunk = decoder.decode(value, { stream: true });
            
            try {
              // Process SSE format (data: {...}\n\n)
              const lines = chunk.split('\n\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const jsonStr = line.substring(6);
                  if (jsonStr === '[DONE]') continue;
                  
                  try {
                    const data = JSON.parse(jsonStr);
                    if (data.choices && data.choices[0]?.delta?.content) {
                      const content = data.choices[0].delta.content;
                      accumulatedContent += content;
                      options.onStreamChunk(content);
                    }
                  } catch (e) {
                    // If we can't parse JSON, it might be a partial chunk
                    console.log("Received partial chunk, waiting for complete data");
                  }
                }
              }
            } catch (e) {
              console.error("Error processing stream chunk:", e);
            }
          }
          
          // Complete with final chunk if needed
          const finalChunk = decoder.decode();
          if (finalChunk) {
            console.log("Processing final chunk:", finalChunk);
            // Process the final chunk if needed
          }
          
          setLoading(false);
          
          // Return the accumulated response
          return {
            choices: [
              {
                message: {
                  role: "assistant",
                  content: accumulatedContent
                }
              }
            ]
          };
        } catch (streamError) {
          console.error("Streaming error:", streamError);
          throw streamError;
        }
      } else {
        // Regular non-streaming API call
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
        setLoading(false);
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
      
      setLoading(false);
      return null;
    }
  };

  return {
    callDeepseek,
    loading,
    error,
  };
};
