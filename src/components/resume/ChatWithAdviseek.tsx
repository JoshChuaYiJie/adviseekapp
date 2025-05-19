
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { useDeepseek } from "@/hooks/useDeepseek";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatWithAdviseekProps {
  sectionType: string;
  contextInfo?: string;
}

export const ChatWithAdviseek = ({ sectionType, contextInfo = '' }: ChatWithAdviseekProps) => {
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const { callDeepseek, loading } = useDeepseek();

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage = { role: 'user' as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    
    // Create context for AI
    const sectionContext = `The user is working on the ${sectionType} section of their resume. ${contextInfo || ''}`;
    
    // Prepare prompt for Deepseek
    const prompt = `
      You are Adviseek, an AI resume assistant helping users create better resumes.
      
      Context: ${sectionContext}
      
      User message: ${input}
      
      Provide helpful, concise advice for the user's resume, specifically about the ${sectionType} section.
      Keep responses professional and actionable, with specific examples when applicable.
      Limit response to 3-4 sentences unless more detail is necessary.
    `;
    
    try {
      // Call Deepseek API
      const response = await callDeepseek(prompt);
      
      if (response && response.choices && response.choices[0].message.content) {
        const aiResponseContent = response.choices[0].message.content;
        const aiMessage = { role: 'assistant' as const, content: aiResponseContent };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        // Handle error in response
        const errorMessage = { 
          role: 'assistant' as const, 
          content: "I'm sorry, I couldn't process your request at the moment. Please try again."
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error calling Deepseek:", error);
      const errorMessage = { 
        role: 'assistant' as const, 
        content: "I'm sorry, there was an error processing your request. Please try again later."
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        type="button"
        variant="outline"
        className="flex items-center"
        onClick={() => setShowChat(!showChat)}
      >
        <MessageSquare className="h-4 w-4 mr-2" /> Chat with Adviseek
      </Button>

      {showChat && (
        <div className="border rounded-md p-4 bg-background shadow-sm mt-4">
          <h4 className="font-medium mb-2">Chat with Adviseek - {sectionType} Assistant</h4>
          
          <ScrollArea className="h-[200px] mb-4 pr-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>How can I help with your {sectionType.toLowerCase()} section?</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`${
                      message.role === 'user'
                        ? 'bg-secondary/50 ml-8'
                        : 'bg-muted mr-8'
                    } p-3 rounded-lg`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {message.role === 'user' ? 'You' : 'Adviseek'}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <div className="flex items-center space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this section..."
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
              disabled={loading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={loading || !input.trim()} 
              size="icon"
              variant="default"
              type="button"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
