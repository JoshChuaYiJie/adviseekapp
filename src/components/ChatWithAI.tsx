
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useDeepseek } from '@/hooks/useDeepseek';

export const ChatWithAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    {role: 'assistant', content: 'Hi there! I\'m your Adviseek AI assistant. How can I help you with your university applications today?'}
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { callDeepseek, loading: deepseekLoading } = useDeepseek();

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = {role: 'user' as const, content: input};
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Call Deepseek API
      const result = await callDeepseek(
        input,
        { maxTokens: 1000, temperature: 0.7, topP: 0.95 }
      );
      
      if (result && result.choices && result.choices[0]?.message?.content) {
        // Add AI response to messages
        const aiResponse = result.choices[0].message.content;
        setMessages(prev => [...prev, {role: 'assistant', content: aiResponse}]);
      } else {
        // Fallback if API call fails
        toast.error("Failed to get a response from AI. Please try again.");
        setMessages(prev => [...prev, {
          role: 'assistant', 
          content: "I'm sorry, I couldn't process your request. Please try again later."
        }]);
      }
    } catch (error) {
      console.error("Error calling Deepseek API:", error);
      toast.error("Error connecting to the AI service. Please try again.");
      setMessages(prev => [...prev, {
        role: 'assistant', 
        content: "I'm having trouble connecting to my brain. Please try again in a moment."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 rounded-full shadow-lg z-40 bg-blue-600 hover:bg-blue-700"
        size="icon"
        aria-label="Chat with AI"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md h-[500px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Chat with Adviseek AI</DialogTitle>
            <DialogDescription>
              Ask me anything about university applications and admissions.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-grow overflow-auto p-4 my-4 border rounded-md">
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
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 max-w-[80%] rounded-lg p-3">
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
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              disabled={isLoading}
              className="flex-grow"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
