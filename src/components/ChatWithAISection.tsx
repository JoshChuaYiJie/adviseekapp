
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDeepseek } from '@/hooks/useDeepseek';

interface ChatWithAISectionProps {
  sectionName: string;
  sectionContent: string;
}

export const ChatWithAISection = ({ sectionName, sectionContent }: ChatWithAISectionProps) => {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    {role: 'assistant', content: `I can help you improve your ${sectionName.toLowerCase()}. What specific assistance do you need?`}
  ]);
  const [input, setInput] = useState('');
  const { callDeepseek, loading } = useDeepseek();

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;
    
    // Add user message
    const userMessage = {role: 'user' as const, content: input};
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    try {
      // Prepare a contextual prompt for the AI
      const contextualPrompt = `
As a resume writing expert, help with the following ${sectionName} section:
"${sectionContent}"

User's question: ${input}

Provide specific, actionable advice to improve this resume section. Focus on clarity, impact, and professional presentation.
`;
      
      // Call Deepseek API
      const result = await callDeepseek(
        contextualPrompt,
        { maxTokens: 1000, temperature: 0.7, topP: 0.95 }
      );
      
      if (result && result.choices && result.choices[0]?.message?.content) {
        // Add AI response to messages
        const aiResponse = result.choices[0].message.content;
        setMessages(prev => [...prev, {role: 'assistant', content: aiResponse}]);
      } else {
        // Handle empty or invalid response
        setMessages(prev => [...prev, {
          role: 'assistant', 
          content: "I'm sorry, I couldn't process your request. Please try again with a more specific question."
        }]);
      }
    } catch (error) {
      console.error("Error in chat:", error);
      setMessages(prev => [...prev, {
        role: 'assistant', 
        content: "I'm having trouble connecting. Please try again in a moment."
      }]);
    }
  };

  return (
    <div className="flex flex-col h-[350px] p-4">
      <ScrollArea className="flex-grow overflow-auto p-4 mb-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 max-w-[80%] rounded-lg p-3">
                <div className="flex space-x-1 items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Ask for help with this section..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          disabled={loading}
          className="flex-grow"
        />
        <Button 
          onClick={handleSendMessage} 
          disabled={!input.trim() || loading}
          size="icon"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </Button>
      </div>
    </div>
  );
};
