
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { useDeepseek } from "@/hooks/useDeepseek";
import { supabase } from "@/integrations/supabase/client";
import { useInterval } from "@/hooks/useInterval";
import { useConversationHistory } from "@/hooks/useConversationHistory";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SegmentAdviseekChatProps {
  segmentType: string;
  currentContent?: string; // Add prop for current field content
}

export const SegmentAdviseekChat = ({ segmentType, currentContent = "" }: SegmentAdviseekChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const { callAI, isLoading } = useDeepseek();
  const [userId, setUserId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [resumeData, setResumeData] = useState<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const { addMessage, getLastMessages } = useConversationHistory(`segment-chat-${segmentType}`);
  
  const loadingTexts = [
    'Resumeing?',
    ':()()()()()()()()',
    'Caterpillar'
  ];

  // Define which segments should show the Adviseek chat
  const allowedSegments = [
    "Education Details",
    "Work Experience Details",
    "Awards and Certificates",
    "Activity Details",
    "Additional Information"
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Rotate loading messages
  useInterval(() => {
    if (isLoading) {
      setLoadingTextIndex((prevIndex) => (prevIndex + 1) % loadingTexts.length);
    }
  }, 2000);

  useEffect(() => {
    const getUserData = async () => {
      // Get current user ID
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      setUserId(currentUserId);
      
      // If user is logged in, get their profile data
      if (currentUserId) {
        // Get profile data
        const { data } = await supabase
          .from('profiles')
          .select('riasec_code, work_value_code, personality_traits, work_environment_preferences, likes, dislikes, recommended_major')
          .eq('id', currentUserId)
          .single();
          
        if (data) {
          setProfileData(data);
        }
        
        // Get resume data
        const { data: resumes } = await supabase
          .from('resumes')
          .select('*')
          .eq('user_id', currentUserId)
          .order('updated_at', { ascending: false })
          .limit(1);
          
        if (resumes && resumes.length > 0) {
          setResumeData(resumes[0]);
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
    if (!input.trim() || isLoading) return;

    // Add user message to chat
    const userMessage = {
      role: "user" as const,
      content: input.trim()
    };
    
    setMessages(prev => [...prev, userMessage]);
    addMessage('user', input.trim());
    const userQuery = input;
    setInput("");

    // Get conversation history for context
    const lastMessages = getLastMessages(10);
    let conversationContext = '';
    if (lastMessages.length > 0) {
      conversationContext = `
        Recent conversation history:
        ${lastMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
      `;
    }

    // Create a context-aware prompt
    let contextualPrompt = `
      ${conversationContext}
      
      The user is working on the ${segmentType} section of their resume and has the following question:
      "${userQuery}"
      
      Please provide helpful, specific advice for improving this section of their resume.
      Focus on best practices, formatting tips, content suggestions, and what recruiters look for.
      Keep your response concise (under 150 words) and tailored to the ${segmentType} section.
      Reference the conversation history to maintain context and avoid repeating information.
      Converse with the user in a friendly, professional tone.
    `;
    
    // Add current field content as context if available
    if (currentContent && currentContent.trim() !== "") {
      contextualPrompt += `
      
      Current content in this section:
      "${currentContent.trim()}"
      
      Please consider this existing content when providing advice.
      Always start with 'I noticed that you (insert something related to their current content here)'
      `;
    }

    if (segmentType === "Education Details"){
      contextualPrompt += `
      There are two fields to respond to: 
      - Institution
      - Qualifications
      `;
    } else if (segmentType === "Work Experience Details") {
      contextualPrompt += `
      There are three fields to respond to: 
      - Role
      - Organization
      - Description      
      `;
    } else if (segmentType === "Awards and Certificates") {
      contextualPrompt += `
      There is one field to respond to:
      - Award title
      `
    } else if (segmentType === "Activity Details  ") {
      contextualPrompt += `
      There are three fields to respond to: 
      - Role
      - Organization
      - Description      
      `;
    } else if (segmentType === "Additional Information") {
      contextualPrompt += `
            There are three fields to respond to: 
      - Languages
      - Interests
      - IT Skills     
      `;
    }
    
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
    
    // Add resume context if available
    if (resumeData) {
      // Format education items
      let educationItems = '';
      try {
        const eduItems = typeof resumeData.educationItems === 'string' 
          ? JSON.parse(resumeData.educationItems) 
          : resumeData.educationItems;
          
        if (Array.isArray(eduItems)) {
          eduItems.forEach((item, index) => {
            educationItems += `
              Education ${index + 1}:
              - Institution: ${item.institution || 'N/A'}
              - Qualification: ${item.qualifications || 'N/A'}
              - Date: ${item.dates || ''}
            `;
          });
        }
      } catch (error) {
        console.error("Error parsing education items:", error);
      }
      
      // Format awards
      let awards = '';
      try {
        const awarditems = typeof resumeData.awards === 'string'
          ? JSON.parse(resumeData.awards)
          : resumeData.awards;
          
        if (Array.isArray(awarditems)) {
          awarditems.forEach((item, index) => {
            awards += `
              Award ${index + 1}:
              - Award: ${item.title || 'N/A'}
              - Date: ${item.date || ''}
            `;
          });
        }
      } catch (error) {
        console.error("Error parsing awards:", error);
      }

      // Format work experience
      let workExperienceItems = '';
      try {
        const workItems = typeof resumeData.work_experience === 'string'
          ? JSON.parse(resumeData.work_experience)
          : resumeData.work_experience;
          
        if (Array.isArray(workItems)) {
          workItems.forEach((item, index) => {
            workExperienceItems += `
              Work Experience ${index + 1}:
              - Organisation: ${item.organization || 'N/A'}
              - Role: ${item.role || 'N/A'}
              - Date: ${item.dates || ''}
              ${item.description ? `- Description: ${item.description}` : ''}
            `;
          });
        }
      } catch (error) {
        console.error("Error parsing work experience:", error);
      }
          
      
      contextualPrompt += `
      
      Resume information:
      - Name: ${resumeData.name || 'Not specified'}
      - Email: ${resumeData.email || 'Not specified'}
      - Phone: ${resumeData.phone || 'Not specified'}
      - Nationality: ${resumeData.nationality || 'Not specified'}
      
      ${resumeData.languages ? `Languages: ${resumeData.languages}` : ''}
      
      ${resumeData.interests ? `Interests: ${resumeData.interests}` : ''}
      
      ${resumeData.it_skills ? `IT Skills: ${resumeData.it_skills}` : ''}
    `;
    }
    

    try {
      // Call AI with non-streaming
      const aiResponse = await callAI(contextualPrompt);
      
      // Add the response to the chat history and conversation history
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: aiResponse
        }
      ]);
      addMessage('assistant', aiResponse);
      
    } catch (error) {
      console.error("Error calling Deepseek:", error);
      const errorMessage = "I'm sorry, I encountered an error. Please try again.";
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: errorMessage
        }
      ]);
      addMessage('assistant', errorMessage);
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
              {isLoading && (
                <div className="p-3 rounded-lg bg-muted text-foreground mr-8">
                  <p className="mb-1 text-xs font-medium">Adviseek</p>
                  <div className="flex items-center">
                    <span className="text-sm">
                      {loadingTexts[loadingTextIndex].split('').map((char, charIndex) => (
                        <span 
                          key={charIndex} 
                          className="inline-block animate-bounce" 
                          style={{ 
                            animationDuration: '1s', 
                            animationDelay: `${charIndex * 0.1}s`
                          }}
                        >
                          {char}
                        </span>
                      ))}
                    </span>
                  </div>
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
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="self-end"
            >
              {isLoading ? (
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
