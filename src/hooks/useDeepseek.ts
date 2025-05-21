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
          let buffer = ''; // Buffer for incomplete chunks
          
          // Process stream chunks
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Convert the Uint8Array to text
            const chunkText = decoder.decode(value, { stream: true });
            buffer += chunkText;
            
            // Split by "data: " and process each event
            const events = buffer.split('data: ');
            
            // Process complete events, keeping any incomplete part in the buffer
            buffer = events.shift() || ''; // Keep the first part as it may be incomplete
            
            for (const event of events) {
              // If this is a complete event that ends with \n\n
              if (event.includes('\n\n')) {
                const [jsonStr, remaining] = event.split('\n\n', 2);
                buffer = remaining || ''; // Any remainder goes back to buffer
                
                if (jsonStr === '[DONE]') {
                  continue;
                }
                
                try {
                  const data = JSON.parse(jsonStr);
                  if (data.choices && data.choices[0]?.delta?.content) {
                    const content = data.choices[0].delta.content;
                    accumulatedContent += content;
                    options.onStreamChunk(content);
                  }
                } catch (e) {
                  console.warn("Error parsing JSON:", e, "Raw JSON:", jsonStr);
                }
              } else {
                // This event is not complete, add it back to the buffer
                buffer += 'data: ' + event;
              }
            }
          }
          
          // Process any remaining buffer content
          if (buffer.trim()) {
            console.log("Processing final buffer:", buffer);
            const cleanedEvents = buffer.split('data: ');
            for (const event of cleanedEvents) {
              if (!event.trim() || event === '[DONE]') continue;
              
              try {
                const data = JSON.parse(event);
                if (data.choices && data.choices[0]?.delta?.content) {
                  const content = data.choices[0].delta.content;
                  accumulatedContent += content;
                  options.onStreamChunk(content);
                }
              } catch (e) {
                // Might be an incomplete JSON object, can be ignored
                console.warn("Error parsing final JSON:", e);
              }
            }
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
