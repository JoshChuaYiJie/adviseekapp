
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { useDeepseek } from "@/hooks/useDeepseek";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SegmentAdviseekChatProps {
  segmentType: string;
}

export const SegmentAdviseekChat = ({ segmentType }: SegmentAdviseekChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const { callDeepseek, loading } = useDeepseek();
  const [userId, setUserId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Define which segments should show the Adviseek chat
  const allowedSegments = [
    "Education Details",
    "Work Experience Details",
    "Awards and Certificates",
    "Activity Details",
    "Additional Information"
  ];

  useEffect(() => {
    const getUserData = async () => {
      // Get current user ID
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      setUserId(currentUserId);
      
      // If user is logged in, get their profile data
      if (currentUserId) {
        const { data } = await supabase
          .from('profiles')
          .select('riasec_code, work_value_code, personality_traits, work_environment_preferences, likes, dislikes, recommended_major')
          .eq('id', currentUserId)
          .single();
          
        if (data) {
          setProfileData(data);
        }
      }
    };
    
    getUserData();
  }, []);

  // If current segment is not in the allowed list, don't render anything
  if (!allowedSegments.includes(segmentType)) {
    return null;
  }

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      // Add initial greeting message when first opened
      setMessages([
        {
          role: "assistant",
          content: `Hi there! I'm Adviseek. How can I help you improve your ${segmentType.toLowerCase()} section?`
        }
      ]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || isStreaming) return;

    // Add user message to chat
    const userMessage = {
      role: "user" as const,
      content: input.trim()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const userQuery = input;
    setInput("");

    // Create a context-aware prompt
    let contextualPrompt = `
      The user is working on the ${segmentType} section of their resume and has the following question:
      "${userQuery}"
      
      Please provide helpful, specific advice for improving this section of their resume.
      Focus on best practices, formatting tips, content suggestions, and what recruiters look for.
      Keep your response concise (under 150 words) and tailored to the ${segmentType} section.
    `;
    
    // Add profile context if available
    if (profileData) {
      contextualPrompt += `
      
      User's profile information to consider when giving advice:
      - RIASEC personality type: ${profileData.riasec_code || 'Unknown'}
      - Work values: ${profileData.work_value_code || 'Unknown'}
      - Personality traits: ${profileData.personality_traits || 'Unknown'}
      - Work preferences: ${profileData.work_environment_preferences || 'Unknown'}
      - Likes: ${profileData.likes || 'Unknown'}
      - Dislikes: ${profileData.dislikes || 'Unknown'}
      ${profileData.recommended_major ? `- Recommended majors: ${profileData.recommended_major}` : ''}
      
      Tailor your advice to match their profile.
      `;
    }

    try {
      // Initialize an empty assistant message to start streaming into
      const assistantMessage = { role: "assistant" as const, content: "" };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Start streaming
      setIsStreaming(true);
      
      await callDeepseek(
        contextualPrompt,
        { stream: true },
        {
          onChunk: (chunk) => {
            setMessages(prevMessages => {
              const newMessages = [...prevMessages];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage.role === "assistant") {
                lastMessage.content += chunk;
              }
              return newMessages;
            });
            
            // Auto-scroll as content arrives
            if (scrollAreaRef.current) {
              const scrollArea = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
              if (scrollArea) {
                setTimeout(() => {
                  scrollArea.scrollTop = scrollArea.scrollHeight;
                }, 0);
              }
            }
          },
          onComplete: () => {
            setIsStreaming(false);
          },
          onError: (error) => {
            setIsStreaming(false);
            setMessages(prev => [
              ...prev,
              {
                role: "assistant",
                content: "I'm sorry, I encountered an error. Please try again."
              }
            ]);
          }
        }
      );
    } catch (error) {
      console.error("Error calling Deepseek:", error);
      setIsStreaming(false);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I encountered an error. Please try again."
        }
      ]);
    }
  };

  return (
    <div className="w-full">
      <Button 
        type="button" 
        variant="outline" 
        onClick={toggleChat}
        className="flex items-center gap-2"
      >
        <MessageSquare className="h-4 w-4" />
        Chat with Adviseek
      </Button>

      {isOpen && (
        <Card className="mt-4 p-4">
          <h4 className="font-medium mb-2">Adviseek Assistant: {segmentType}</h4>
          
          <ScrollArea className="h-60 mb-4 border rounded-md p-2" ref={scrollAreaRef}>
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg ${
                    msg.role === "assistant"
                      ? "bg-muted text-foreground mr-8"
                      : "bg-primary/10 ml-8"
                  }`}
                >
                  <p className="mb-1 text-xs font-medium">
                    {msg.role === "assistant" ? "Adviseek" : "You"}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
              {isStreaming && (
                <div className="flex justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about your ${segmentType.toLowerCase()} section...`}
              className="flex-1 resize-none"
              disabled={loading || isStreaming}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || isStreaming || !input.trim()}
              className="self-end"
            >
              {loading || isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
