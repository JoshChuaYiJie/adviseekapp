
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
      let resumeContext = '';
      
      if (userId) {
        // Get profile information
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
        
        // NEW: Get resume information for additional context
        const { data: resumes } = await supabase
          .from('resumes')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1);
          
        if (resumes && resumes.length > 0) {
          const latestResume = resumes[0];
          
          // Format education items
          let educationItems = '';
          try {
            const eduItems = typeof latestResume.educationItems === 'string' 
              ? JSON.parse(latestResume.educationItems) 
              : latestResume.educationItems;
              
            if (Array.isArray(eduItems)) {
              eduItems.forEach((item, index) => {
                educationItems += `
                  Education ${index + 1}:
                  - Institution: ${item.institution || 'N/A'}
                  - Degree: ${item.degree || 'N/A'}
                  - Field: ${item.fieldOfStudy || 'N/A'}
                  - Date: ${item.startDate || ''} - ${item.endDate || ''}
                  ${item.description ? `- Description: ${item.description}` : ''}
                `;
              });
            }
          } catch (error) {
            console.error("Error parsing education items:", error);
          }
          
          // Format work experience items
          let workExperienceItems = '';
          try {
            const workItems = typeof latestResume.work_experience === 'string'
              ? JSON.parse(latestResume.work_experience)
              : latestResume.work_experience;
              
            if (Array.isArray(workItems)) {
              workItems.forEach((item, index) => {
                workExperienceItems += `
                  Work Experience ${index + 1}:
                  - Company: ${item.company || 'N/A'}
                  - Position: ${item.position || 'N/A'}
                  - Date: ${item.startDate || ''} - ${item.endDate || ''}
                  ${item.description ? `- Description: ${item.description}` : ''}
                `;
              });
            }
          } catch (error) {
            console.error("Error parsing work experience:", error);
          }
          
          resumeContext = `
            Resume information:
            - Name: ${latestResume.name || 'Not specified'}
            - Email: ${latestResume.email || 'Not specified'}
            - Phone: ${latestResume.phone || 'Not specified'}
            - Nationality: ${latestResume.nationality || 'Not specified'}
            
            ${educationItems ? `Education:\n${educationItems}` : ''}
            
            ${workExperienceItems ? `Work Experience:\n${workExperienceItems}` : ''}
            
            ${latestResume.awards ? `Awards: ${latestResume.awards}` : ''}
            
            ${latestResume.languages ? `Languages: ${latestResume.languages}` : ''}
            
            ${latestResume.interests ? `Interests: ${latestResume.interests}` : ''}
            
            ${latestResume.it_skills ? `IT Skills: ${latestResume.it_skills}` : ''}
          `;
        }
      }
      
      // Create context-enriched prompt with both profile and resume data
      const contextualPrompt = `
        User profile context:
        ${profileContext} and ${resumeContext}
        
        User message: ${input}
        
        You are an AI helpful academic and career guidance conversational assistant called Adviseek AI. I have provided you with the user profile. According to the user's message, respond in a friendly manner, providing relevant information and advice. You can also ask clarifying questions if needed. Your goal is to assist the user in their academic and career journey, including university applications, admissions, and related topics.
        You can also provide insights based on the user's profile and resume information. Please ensure your responses are clear, concise, and helpful.
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
