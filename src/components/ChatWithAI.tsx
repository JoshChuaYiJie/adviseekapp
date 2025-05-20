
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useDeepseek } from '@/hooks/useDeepseek';
import { supabase } from '@/integrations/supabase/client';

export const ChatWithAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    {role: 'assistant', content: 'Hi there! I\'m your Adviseek AI assistant. How can I help you with your university applications today?'}
  ]);
  const [input, setInput] = useState('');
  const { callDeepseek, loading } = useDeepseek();
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const getUserId = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id || null);
    };
    getUserId();
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;
    
    // Add user message
    const userMessage = {role: 'user' as const, content: input};
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    try {
      // Fetch profile data for context enrichment
      let profileContext = '';
      
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('riasec_code, work_value_code, personality_traits, work_environment_preferences, likes, dislikes, recommended_major')
          .eq('id', userId)
          .single();
          
        if (profile) {
          profileContext = `
            User profile information:
            - RIASEC code: ${profile.riasec_code || 'Not available'}
            - Work values: ${profile.work_value_code || 'Not available'}
            - Personality traits: ${profile.personality_traits || 'Not available'}
            - Work preferences: ${profile.work_environment_preferences || 'Not available'}
            - Likes: ${profile.likes || 'Not available'}
            - Dislikes: ${profile.dislikes || 'Not available'}
            - Recommended majors: ${profile.recommended_major || 'Not available'}
          `;
        }
      }
      
      // Create context-enriched prompt
      const contextualPrompt = `
        ${profileContext}
        
        User message: ${input}
        
        Respond as a helpful academic and career guidance assistant. Keep your response concise but informative.
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
          <DialogHeader className="flex justify-between items-center flex-row">
            <div>
              <DialogTitle>Chat with Adviseek AI</DialogTitle>
              <DialogDescription>
                Ask me anything about university applications and admissions.
              </DialogDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
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
              {loading && (
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
              disabled={loading}
              className="flex-grow"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!input.trim() || loading}
              size="icon"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
