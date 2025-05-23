
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useDeepseek } from '@/hooks/useDeepseek';
import { supabase } from '@/integrations/supabase/client';
import { useInterval } from '@/hooks/useInterval';

export const ChatWithAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    {role: 'assistant', content: 'Hi there! I\'m your Adviseek AI assistant. How can I help you with your university applications today?'}
  ]);
  const [input, setInput] = useState('');
  const { callAI, isLoading } = useDeepseek();
  const [userId, setUserId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  
  const loadingTexts = [
    'Adviseek is thinking',
    'Seeking Advice',
    'Speaking to pros'
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

  // Get current user ID
  useEffect(() => {
    const getUserId = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id || null);
    };
    getUserId();
  }, []);

  // Save feedback to Supabase
  const saveFeedback = async (conversationData: {question: string, answer: string}) => {
    if (!userId) return;
    
    try {
      await supabase.from('user_feedback')
        .insert({
          user_id: userId,
          feedback_type: 'chat_interaction',
          feedback_text: JSON.stringify(conversationData),
          page_context: 'main_chat'
        });
      
      console.log('Chat interaction saved to feedback');
    } catch (error) {
      console.error('Error saving chat feedback:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    // Add user message
    const userMessage = {role: 'user' as const, content: input};
    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
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
        
        // Get resume information for additional context
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
            const awarditems = typeof latestResume.awards === 'string'
              ? JSON.parse(latestResume.awards)
              : latestResume.awards;
              
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
            const workItems = typeof latestResume.work_experience === 'string'
              ? JSON.parse(latestResume.work_experience)
              : latestResume.work_experience;
              
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
          
          resumeContext = `
            Resume information:
            - Name: ${latestResume.name || 'Not specified'}
            - Email: ${latestResume.email || 'Not specified'}
            - Phone: ${latestResume.phone || 'Not specified'}
            - Nationality: ${latestResume.nationality || 'Not specified'}
            
            ${educationItems ? `Education:\n${educationItems}` : ''}
            
            ${workExperienceItems ? `Work Experience:\n${workExperienceItems}` : ''}
            
            ${latestResume.awards ? `Awards:\n${awards}` : ''}
            
            ${latestResume.languages ? `Languages: ${latestResume.languages}` : ''}
            
            ${latestResume.interests ? `Interests: ${latestResume.interests}` : ''}
            
            ${latestResume.it_skills ? `IT Skills: ${latestResume.it_skills}` : ''}
          `;
        }
      }
      console.log("Resume Context:", resumeContext);
      // Create context-enriched prompt with both profile and resume data
      const contextualPrompt = `
        User profile context: ${profileContext}
        User resume context: ${resumeContext}
        User message: ${userInput}

        You are Adviseek AI, a conversational assistant specializing in academic and career guidance. Your goal is to provide clear, concise, and personalized advice to support the user's academic and career journey, including university applications, admissions, study strategies, resume building, career exploration, and interview preparation.

        **Instructions**:
        - Respond in a professional yet approachable tone, balancing clarity and warmth.
        - Use Markdown to structure responses with:
          - Clear headings (## or ###) for main sections and subsections.
          - Short paragraphs (2-3 sentences) and concise bullet points (3-5 per section).
          - Numbered lists for step-by-step advice when relevant.
        - Limit initial responses to 100-150 words, summarizing key advice and offering to elaborate if needed.
        - Use 1-2 emojis per response for warmth (e.g., at the start or end), avoiding overuse.
        - Integrate specific details from the user's profile and resume to tailor advice, referencing relevant education, skills, or goals.
        - If the user's message is vague, ask a targeted clarifying question based on their profile or resume.
        - Prioritize readability with whitespace, short sentences, and clear section breaks.
        - End with a clear call-to-action (e.g., a question or invitation) to engage the user further.
        - There is no need to explicitly state the user's profile or resume (unless relevant)

        Example response structure:
        ## [Relevant Topic]
        [Short introduction, 1-2 sentences]
        - [Key point or advice]
        - [Key point or advice]
        - [Key point or advice]
        [Optional clarifying question or call-to-action]
      `;
      
      // Call AI with complete context
      const aiResponse = await callAI(contextualPrompt);
      
      // Add AI response to messages
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: aiResponse
      }]);
      
      // Save the conversation to feedback
      saveFeedback({
        question: userInput,
        answer: aiResponse
      });
      
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
        <DialogContent className="sm:max-w-3xl h-[700px] flex flex-col max-h-[90vh] w-[90vw]">
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
          
          <ScrollArea className="flex-grow overflow-auto p-4 my-4 border rounded-md" ref={scrollAreaRef}>
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
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 max-w-[80%] rounded-lg p-3">
                    <div className="flex items-center gap-1">
                      {loadingTexts[loadingTextIndex].split('').map((char, i) => (
                        <span 
                          key={i} 
                          className="inline-block animate-bounce" 
                          style={{ 
                            animationDuration: '1s', 
                            animationDelay: `${i * 0.1}s`
                          }}
                        >
                          {char}
                        </span>
                      ))}
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
              {isLoading ? (
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
