
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeepseekOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

interface UserContextData {
  riasec_code?: string;
  work_value_code?: string;
  personality_traits?: string;
  work_environment_preferences?: string;
  likes?: string;
  dislikes?: string;
  recommended_major?: string;
  open_ended_responses?: Array<{
    question: string;
    response: string;
  }>;
  previous_applications?: Array<{
    university: string;
    degree: string;
    major: string;
  }>;
}

export const useDeepseek = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userContext, setUserContext] = useState<UserContextData>({});
  const [chatHistory, setChatHistory] = useState<Array<{role: string, content: string}>>([]);

  // Load user context data when hook is initialized
  useEffect(() => {
    const loadUserContext = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session?.user) return;

        const userId = session.session.user.id;

        // Load user profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select(`
            riasec_code, 
            work_value_code, 
            personality_traits, 
            work_environment_preferences, 
            likes, 
            dislikes, 
            recommended_major
          `)
          .eq('id', userId)
          .single();

        // Load open-ended responses
        const { data: openEndedResponses } = await supabase
          .from('open_ended_responses')
          .select('question, response')
          .eq('user_id', userId);

        // Load previous applications
        const { data: applications } = await supabase
          .from('applied_programs')
          .select('university, degree, major')
          .eq('user_id', userId);

        setUserContext({
          // Create a new context object with default empty values
          riasec_code: profileData?.riasec_code || undefined,
          work_value_code: profileData?.work_value_code || undefined,
          personality_traits: profileData?.personality_traits || undefined,
          work_environment_preferences: profileData?.work_environment_preferences || undefined,
          likes: profileData?.likes || undefined,
          dislikes: profileData?.dislikes || undefined,
          recommended_major: profileData?.recommended_major || undefined,
          open_ended_responses: openEndedResponses || [],
          previous_applications: applications || []
        });

      } catch (error) {
        console.error("Error loading user context:", error);
      }
    };

    loadUserContext();
  }, []);

  // Add message to chat history
  const addToChatHistory = (role: "user" | "assistant", content: string) => {
    setChatHistory(prev => {
      const newHistory = [...prev, { role, content }];
      // Keep only last 10 messages
      return newHistory.slice(-10);
    });
  };

  const buildContextString = (prompt: string): string => {
    let contextString = "";

    // Add RIASEC and Work Value codes if available
    if (userContext.riasec_code) {
      contextString += `User RIASEC code: ${userContext.riasec_code}\n`;
    }
    if (userContext.work_value_code) {
      contextString += `User Work Value code: ${userContext.work_value_code}\n`;
    }

    // Add personality traits and preferences
    if (userContext.personality_traits) {
      contextString += `User personality traits: ${userContext.personality_traits}\n`;
    }
    if (userContext.work_environment_preferences) {
      contextString += `User work environment preferences: ${userContext.work_environment_preferences}\n`;
    }
    if (userContext.likes) {
      contextString += `User likes: ${userContext.likes}\n`;
    }
    if (userContext.dislikes) {
      contextString += `User dislikes: ${userContext.dislikes}\n`;
    }
    if (userContext.recommended_major) {
      contextString += `User recommended major: ${userContext.recommended_major}\n`;
    }

    // Add open-ended responses
    if (userContext.open_ended_responses && userContext.open_ended_responses.length > 0) {
      contextString += "\nUser's responses to open-ended questions:\n";
      userContext.open_ended_responses.forEach(item => {
        contextString += `Q: ${item.question}\nA: ${item.response}\n\n`;
      });
    }

    // Add previous applications
    if (userContext.previous_applications && userContext.previous_applications.length > 0) {
      contextString += "\nUser's previous university applications:\n";
      userContext.previous_applications.forEach((app, index) => {
        contextString += `${index + 1}. ${app.university}: ${app.degree} in ${app.major}\n`;
      });
    }

    // Add chat history
    if (chatHistory.length > 0) {
      contextString += "\nRecent conversation history:\n";
      chatHistory.forEach(msg => {
        contextString += `${msg.role.toUpperCase()}: ${msg.content}\n`;
      });
    }

    // Add separator between context and prompt
    if (contextString) {
      contextString += "\n--- Current User Query ---\n";
    }

    return contextString + prompt;
  };

  const callDeepseek = async (prompt: string, options?: DeepseekOptions) => {
    try {
      setLoading(true);
      setError(null);

      const contextualizedPrompt = buildContextString(prompt);
      
      console.log("Calling Deepseek function with contextualized prompt");
      
      const { data, error } = await supabase.functions.invoke('deepseek-call', {
        body: { 
          prompt: contextualizedPrompt, 
          options: {
            ...(options || {}),  // Ensure we're spreading an object by providing a fallback empty object
            stream: true  // Enable streaming for all calls
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

      console.log("Received response from Deepseek");
      
      // Add to chat history
      addToChatHistory("user", prompt);
      if (data.choices && data.choices[0]?.message?.content) {
        addToChatHistory("assistant", data.choices[0].message.content);
      }
      
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
