
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
        
        // Setup stream reader
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
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to stream response");
        }

        // Process the stream
        const reader = response.body?.getReader();
        if (!reader) throw new Error("Failed to get stream reader");

        let accumulatedContent = '';
        
        // Process stream chunks
        const processStream = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Convert the Uint8Array to text
            const chunk = new TextDecoder().decode(value);
            
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
                    console.error("Error parsing chunk:", e);
                  }
                }
              }
            } catch (e) {
              console.error("Error processing stream chunk:", e);
            }
          }
        };

        await processStream();
        setLoading(false);
        
        // Return the accumulated response in the same format as non-streaming API
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
