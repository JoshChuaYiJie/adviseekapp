
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { useDeepseek } from "@/hooks/useDeepseek";

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

  // Define which segments should show the Adviseek chat
  const allowedSegments = [
    "Education Details",
    "Work Experience Details",
    "Awards and Certificates",
    "Activity Details",
    "Additional Information"
  ];

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
    if (!input.trim() || loading) return;

    // Add user message to chat
    const userMessage = {
      role: "user" as const,
      content: input.trim()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const userQuery = input;
    setInput("");

    // Create a context-aware prompt
    const prompt = `
      The user is working on the ${segmentType} section of their resume and has the following question:
      "${userQuery}"
      
      Please provide helpful, specific advice for improving this section of their resume.
      Focus on best practices, formatting tips, content suggestions, and what recruiters look for.
      Keep your response concise (under 150 words) and tailored to the ${segmentType} section.
    `;

    try {
      const response = await callDeepseek(prompt);
      
      if (response) {
        const aiResponse = response.choices?.[0]?.message?.content || 
                          "I'm sorry, I couldn't generate a response. Please try again.";
        
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: aiResponse
          }
        ]);
      }
    } catch (error) {
      console.error("Error calling Deepseek:", error);
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
          
          <ScrollArea className="h-60 mb-4 border rounded-md p-2">
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
            </div>
          </ScrollArea>
          
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about your ${segmentType.toLowerCase()} section...`}
              className="flex-1 resize-none"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="self-end"
            >
              {loading ? (
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
