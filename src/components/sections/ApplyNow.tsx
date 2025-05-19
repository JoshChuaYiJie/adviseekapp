
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  loadUniversityData, 
  getDegrees, 
  getMajorsForDegree, 
  getUniversityShortName,
  UniversityData,
  Major
} from "@/utils/universityDataUtils";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageSquare } from "lucide-react";
import { useDeepseek } from "@/hooks/useDeepseek";

interface ApplicationQuestion {
  id: string;
  text: string;
  wordLimit?: number;
}

export const ApplyNow = () => {
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [questions, setQuestions] = useState<ApplicationQuestion[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [universityData, setUniversityData] = useState<UniversityData | null>(null);
  const [availableDegrees, setAvailableDegrees] = useState<string[]>([]);
  const [availableMajors, setAvailableMajors] = useState<Major[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const { isCurrentlyDark } = useTheme();
  const { t } = useTranslation();
  const { callDeepseek, loading: aiLoading } = useDeepseek();
  
  // New states for the adviseek chat functionality
  const [activeChatQuestion, setActiveChatQuestion] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, Array<{role: "user" | "assistant", content: string}>>>({});
  const [userProfileData, setUserProfileData] = useState<any>(null);
  const [previousApplications, setPreviousApplications] = useState<any[]>([]);

  const universities = ["National University of Singapore", "Nanyang Technological University", "Singapore Management University"];

  // Load university data when university changes
  useEffect(() => {
    if (!selectedUniversity) {
      setUniversityData(null);
      setAvailableDegrees([]);
      setError(null);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`Loading university data for: ${selectedUniversity}`);
        const data = await loadUniversityData(selectedUniversity);
        setUniversityData(data);
        
        if (data && data.programs && data.programs.length > 0) {
          console.log(`Data loaded successfully with ${data.programs.length} programs`);
          const degrees = getDegrees(data);
          setAvailableDegrees(degrees);
          console.log(`${degrees.length} degrees found:`, degrees);
        } else {
          setError("No programs found in the data");
          toast.error("No programs found for this university");
        }
      } catch (error) {
        console.error("Error loading university data:", error);
        setError("Failed to load university data");
        toast.error("Failed to load university data. Please check if the data files exist.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedUniversity]);

  // Update available majors when degree changes
  useEffect(() => {
    if (!universityData || !selectedDegree) {
      setAvailableMajors([]);
      return;
    }

    const majors = getMajorsForDegree(universityData, selectedDegree);
    setAvailableMajors(majors);
    console.log(`Found ${majors.length} majors for ${selectedDegree}:`, majors);
  }, [universityData, selectedDegree]);

  // Reset selections when dependencies change
  useEffect(() => {
    if (!selectedUniversity) {
      setSelectedDegree("");
    }
  }, [selectedUniversity]);

  useEffect(() => {
    if (!selectedDegree) {
      setSelectedMajor("");
    }
  }, [selectedDegree]);

  // Load user profile data for AI context
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session?.user) return;

        // Load user profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id, 
            riasec_code, 
            work_value_code, 
            personality_traits, 
            work_environment_preferences, 
            likes, 
            dislikes, 
            recommended_major
          `)
          .eq('id', session.session.user.id)
          .single();

        if (!profileError && profileData) {
          setUserProfileData(profileData);
        }

        // Load previous applications
        const { data: applications, error: applicationsError } = await supabase
          .from('applied_programs')
          .select('university, school, major, degree')
          .eq('user_id', session.session.user.id);

        if (!applicationsError && applications) {
          setPreviousApplications(applications);
        }
      } catch (error) {
        console.error("Error loading user profile data:", error);
      }
    };

    loadUserProfile();
  }, []);

  const getUniversitySpecificQuestions = (university: string): ApplicationQuestion[] => {
    switch (university) {
      case "National University of Singapore":
        return [
          { id: "nus-q1", text: "Tell us something you have done outside your school curriculum to prepare yourself for your chosen degree programme(s) (600)" },
          { id: "nus-q2", text: "Describe an instance when you did not succeed in accomplishing something on your first attempt but succeeded on subsequent attempts. How and what did you learn from your initial failure, and what changes did you make to your approach to eventually succeed? (600)" },
          { id: "nus-q3", text: "Share something that is meaningful to you and explain how it has impacted you in a concrete way. (600)" },
          { id: "nus-q4", text: "What is your proudest achcievement, and how did you accomplish it with the help or inspiration from others? Please also explain how it exemplifies some of the five NUS values of Innovation, Resilience, Excellence, Respect and Integrity. (1100)" },
          { id: "nus-q5", text: "Is there anything else about yourself which you want us to know? (600)" },
          { id: "nus-q6", text: "List up to four achievements that may include co-curricular activities, and non-academic activities (e.g social work, competitive sports) in which you have participated. If you have no achievements, please select Not applicable." }
        ];
      case "Nanyang Technological University":
        return [
          { id: "ntu-q1", text: "Please list down outstanding achievements including medalist in International Science Olympiad competitions, represented country in international competition in the area of the Arts or Sports, in training team for International Olympiad Competitions. (200 words)" }
        ];
      case "Singapore Management University":
        return [
          { id: "smu-q1", text: "Describe the highlights of your most outstanding achievements/contributions/attributes (Maximum: 300 words)", wordLimit: 300 },
          { id: "smu-q2", text: "What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time? (Maximum 50 words)", wordLimit: 50 },
          { id: "smu-q3", text: "What have you done to make your school or your community a better place? (Maximum 50 words)", wordLimit: 50 },
          { id: "smu-q4", text: "What are your future plans or career interests? We are aware that many future plans will change, but this is just another way for us to get to know you as an individual." }
        ];
      default:
        return [];
    }
  };

  const handleUniversityChange = (university: string) => {
    console.log(`University selected: ${university}`);
    setSelectedUniversity(university);
    setSelectedDegree("");
    setSelectedMajor("");
    setQuestions([]);
    setResponses({});
  };

  const handleDegreeChange = (degree: string) => {
    console.log(`Degree selected: ${degree}`);
    setSelectedDegree(degree);
    setSelectedMajor("");
    setQuestions([]);
    setResponses({});
  };

  const handleMajorChange = async (major: string) => {
    console.log(`Major selected: ${major}`);
    setSelectedMajor(major);
    
    // Load university-specific questions
    const universityQuestions = getUniversitySpecificQuestions(selectedUniversity);
    setQuestions(universityQuestions);
    
    // Initialize empty responses
    const initialResponses: Record<string, string> = {};
    universityQuestions.forEach(q => {
      initialResponses[q.id] = "";
    });
    setResponses(initialResponses);
    
    // Try to load saved responses from Supabase
    await loadSavedResponses(selectedUniversity, selectedDegree, major, universityQuestions);
  };
  
  const loadSavedResponses = async (university: string, degree: string, Major: string, questions: ApplicationQuestion[]) => {
    try {
      setIsLoadingResponses(true);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        toast.error("You need to be logged in to load saved responses.");
        setIsLoadingResponses(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('application_responses')
        .select('question_id, response')
        .eq('user_id', session.session.user.id)
        .eq('university', university)
        .eq('degree', degree)
        .eq('Major', Major);
      
      if (error) {
        console.error("Error loading saved responses:", error);
        toast.error("Failed to load your saved responses.");
        setIsLoadingResponses(false);
        return;
      }
      
      if (data && data.length > 0) {
        const savedResponses: Record<string, string> = {};
        questions.forEach(q => {
          const savedResponse = data.find(r => r.question_id === q.id);
          savedResponses[q.id] = savedResponse ? savedResponse.response : "";
        });
        
        console.log("Loaded saved responses:", savedResponses);
        setResponses(savedResponses);
        toast.success("Loaded your previously saved responses.");
      } else {
        console.log("No saved responses found");
      }
    } catch (error) {
      console.error("Error in loadSavedResponses:", error);
    } finally {
      setIsLoadingResponses(false);
    }
  };

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSaveResponses = async () => {
    try {
      setIsSaving(true);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        toast.error("You need to be logged in to save responses.");
        setIsSaving(false);
        return;
      }
      
      const responsesToSave = questions.map(question => ({
        user_id: session.session.user.id,
        university: selectedUniversity,
        degree: selectedDegree,
        Major: selectedMajor,
        question_id: question.id,
        question: question.text,
        response: responses[question.id] || ""
      }));
      
      console.log("Saving responses:", responsesToSave);
      
      for (const response of responsesToSave) {
        const { error } = await supabase
          .from('application_responses')
          .upsert(response, { 
            onConflict: 'user_id,university,degree,Major,question_id' 
          });
          
        if (error) {
          console.error("Error saving response:", error);
          toast.error("There was a problem saving your responses.");
          setIsSaving(false);
          return;
        }
      }
      
      // After successfully saving responses, save to applied programs
      const shortName = getUniversityShortName(selectedUniversity);
      const selectedMajorObj = availableMajors.find(m => m.major === selectedMajor);
      
      // Define programData before using it
      const programData = {
        user_id: session.session.user.id,
        university: selectedUniversity,
        school: shortName,
        major: selectedMajor,
        degree: selectedDegree,
        logo_path: `/school-logos/${shortName}.png`,
        college: selectedMajorObj?.college
      };
      
      // Check if the entry already exists before inserting
      const { data: existingPrograms } = await supabase
        .from('applied_programs')
        .select('id')
        .eq('user_id', session.session.user.id)
        .eq('university', selectedUniversity)
        .eq('degree', selectedDegree)
        .eq('major', selectedMajor);
        
      let programError = null;
      
      if (existingPrograms && existingPrograms.length > 0) {
        // Entry exists, update it
        const { error } = await supabase
          .from('applied_programs')
          .update(programData)
          .eq('id', existingPrograms[0].id);
        programError = error;
      } else {
        // Entry doesn't exist, insert it
        const { error } = await supabase
          .from('applied_programs')
          .insert(programData);
        programError = error;
      }
      
      if (programError) {
        console.error("Error saving to applied programs:", programError);
        toast.error("Your responses were saved, but there was a problem adding this to your applied programs.");
      } else {
        toast.success("Your responses have been saved and added to your applied programs!");
      }
      
    } catch (error) {
      console.error("Error saving responses:", error);
      toast.error("There was a problem saving your responses.");
    } finally {
      setIsSaving(false);
    }
  };

  const getWordCount = (text: string): number => {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  };

  // New function to toggle chat for a specific question
  const toggleQuestionChat = (questionId: string) => {
    if (activeChatQuestion === questionId) {
      setActiveChatQuestion(null);
    } else {
      setActiveChatQuestion(questionId);
      // Initialize chat messages for this question if it doesn't exist
      if (!chatMessages[questionId]) {
        setChatMessages(prev => ({
          ...prev,
          [questionId]: [{
            role: "assistant",
            content: "Hi there! I'm Adviseek. How can I help you with your application response?"
          }]
        }));
      }
    }
  };

  // New function to send message to AI
  const sendChatMessage = async (questionId: string, questionText: string, userInput: string) => {
    if (!userInput.trim() || aiLoading) return;

    // Add user message to chat
    const updatedMessages = [
      ...(chatMessages[questionId] || []),
      { role: "user" as const, content: userInput.trim() }
    ];
    
    setChatMessages(prev => ({
      ...prev,
      [questionId]: updatedMessages
    }));

    // Prepare all context for the AI
    const currentResponse = responses[questionId] || "";
    
    // Build rich context for the AI
    let aiContext = `The user is filling out an application for ${selectedUniversity}, ${selectedDegree} degree in ${selectedMajor}.\n\n`;
    
    // Add the current question
    aiContext += `The current question they're responding to is: "${questionText}"\n\n`;
    
    // Add their current response draft
    aiContext += `Their current draft response is: "${currentResponse}"\n\n`;
    
    // Add profile information if available
    if (userProfileData) {
      aiContext += "USER PROFILE INFORMATION:\n";
      if (userProfileData.riasec_code) aiContext += `RIASEC code: ${userProfileData.riasec_code}\n`;
      if (userProfileData.work_value_code) aiContext += `Work value code: ${userProfileData.work_value_code}\n`;
      if (userProfileData.personality_traits) aiContext += `Personality traits: ${userProfileData.personality_traits}\n`;
      if (userProfileData.work_environment_preferences) aiContext += `Work environment preferences: ${userProfileData.work_environment_preferences}\n`;
      if (userProfileData.likes) aiContext += `Likes: ${userProfileData.likes}\n`;
      if (userProfileData.dislikes) aiContext += `Dislikes: ${userProfileData.dislikes}\n`;
      if (userProfileData.recommended_major) aiContext += `Recommended major: ${userProfileData.recommended_major}\n`;
    }
    
    // Add previous applications if available
    if (previousApplications && previousApplications.length > 0) {
      aiContext += "\nPREVIOUS APPLICATIONS:\n";
      previousApplications.forEach((app, index) => {
        aiContext += `${index + 1}. ${app.university} - ${app.degree} in ${app.major}\n`;
      });
    }
    
    // Add conversation history for context
    if (updatedMessages.length > 1) {
      aiContext += "\nRECENT CONVERSATION HISTORY:\n";
      // Get the last 10 messages or fewer if there aren't that many
      const recentMessages = updatedMessages.slice(-11, -1); // Exclude the last message which is the current query
      recentMessages.forEach((msg) => {
        aiContext += `${msg.role.toUpperCase()}: ${msg.content}\n`;
      });
    }

    const prompt = `
${aiContext}

The user's current query is: "${userInput}"

Please help the user improve their application response, provide advice, or answer their question.
Focus on helping them create a compelling response that showcases their strengths and aligns with what the university is looking for.
If there's a word limit mentioned in the question, help them stay within that limit while maximizing impact.
`;

    try {
      const response = await callDeepseek(prompt);
      
      if (response) {
        const aiResponse = response.choices?.[0]?.message?.content || 
                          "I'm sorry, I couldn't generate a response. Please try again.";
        
        setChatMessages(prev => ({
          ...prev,
          [questionId]: [
            ...(prev[questionId] || []),
            { role: "assistant", content: aiResponse }
          ]
        }));
      }
    } catch (error) {
      console.error("Error calling Deepseek:", error);
      setChatMessages(prev => ({
        ...prev,
        [questionId]: [
          ...(prev[questionId] || []),
          { role: "assistant", content: "I'm sorry, I encountered an error. Please try again." }
        ]
      }));
    }
  };

  return (
    <div className="w-full h-full space-y-6">
      <div className={`mb-8 p-6 ${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow w-full`}>
        <h3 className="text-lg font-semibold mb-2">{t("apply.select_header", "Select University and Major")}</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("apply.university", "University")}</label>
            <Select 
              value={selectedUniversity}
              onValueChange={handleUniversityChange}
              data-tutorial="university-select"
              disabled={isLoading}
            >
              <SelectTrigger className={`w-full ${isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : ''}`}>
                <SelectValue placeholder={t("apply.select_university", "Select University")} />
              </SelectTrigger>
              <SelectContent className={isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : ''}>
                {universities.map(uni => (
                  <SelectItem key={uni} value={uni}>
                    {t(`universities.${uni.replace(/\s+/g, '_').toLowerCase()}`, uni)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm p-2 rounded bg-red-100 dark:bg-red-900/20">
              {error}. Please check if the data files are in the correct location.
            </div>
          )}
          
          {selectedUniversity && (
            <div>
              <label className="block text-sm font-medium mb-1">{t("apply.degree", "Degree")}</label>
              <Select 
                value={selectedDegree}
                onValueChange={handleDegreeChange}
                disabled={isLoading || !availableDegrees.length}
              >
                <SelectTrigger className={`w-full ${isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : ''}`}>
                  <SelectValue placeholder={isLoading ? "Loading..." : t("apply.select_degree", "Select Degree")} />
                </SelectTrigger>
                <SelectContent className={isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : ''}>
                  {availableDegrees.length > 0 ? (
                    availableDegrees.map(degree => (
                      <SelectItem key={degree} value={degree}>
                        {degree}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-degrees" disabled>No degrees found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {selectedDegree && (
            <div>
              <label className="block text-sm font-medium mb-1">{t("apply.Major", "Major")}</label>
              <Select 
                value={selectedMajor}
                onValueChange={handleMajorChange}
                data-tutorial="program-select"
                disabled={isLoading || !availableMajors.length}
              >
                <SelectTrigger className={`w-full ${isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : ''}`}>
                  <SelectValue placeholder={isLoading ? "Loading..." : t("apply.select_Major", "Select Major")} />
                </SelectTrigger>
                <SelectContent className={isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : ''}>
                  {availableMajors.length > 0 ? (
                    availableMajors.map(major => (
                      <SelectItem key={major.major} value={major.major}>
                        {major.major} {major.college ? `(${major.college})` : ''}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-majors" disabled>No majors found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {isLoadingResponses && (
        <div className="flex justify-center items-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2">Loading your saved responses...</span>
        </div>
      )}

      {!isLoadingResponses && questions.length > 0 && (
        <div data-tutorial="application-questions" className={`${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} p-6 rounded-lg shadow w-full`}>
          <h3 className="text-lg font-semibold mb-4">{t("apply.questions_header", "Application Questions")}</h3>
          
          <div className="space-y-6">
            {questions.map((question, index) => {
              const wordCount = getWordCount(responses[question.id] || '');
              const wordLimit = question.wordLimit || (
                question.text.includes('(600)') ? 600 : 
                question.text.includes('(1100)') ? 1100 : 
                question.text.includes('(200 words)') ? 200 : 
                question.text.includes('(Maximum: 300 words)') ? 300 :
                question.text.includes('(Maximum 50 words)') ? 50 : 
                undefined
              );
              
              return (
                <Card key={index} className={`p-4 ${isCurrentlyDark ? 'bg-gray-700 border-gray-600' : ''}`}>
                  <h4 className="font-medium mb-2">{question.text}</h4>
                  <div className="relative">
                    <Textarea 
                      className={`w-full border rounded p-2 min-h-[120px] ${
                        isCurrentlyDark ? 'bg-gray-600 text-white border-gray-500' : ''
                      }`}
                      value={responses[question.id] || ""}
                      onChange={(e) => handleResponseChange(question.id, e.target.value)}
                      placeholder={t("apply.response_placeholder", "Type your response here...")}
                      onFocus={() => setActiveChatQuestion(null)} // Close chat when focusing on textarea
                    />
                    {responses[question.id] && responses[question.id].length > 10 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute right-2 bottom-2 flex items-center gap-1"
                        onClick={() => toggleQuestionChat(question.id)}
                      >
                        <MessageSquare className="h-3 w-3" />
                        Chat with Adviseek
                      </Button>
                    )}
                  </div>
                  {wordLimit && (
                    <div className={`text-xs mt-1 flex justify-end ${
                      wordCount > wordLimit ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {wordCount} / {wordLimit} words
                      {wordCount > wordLimit && (
                        <span className="ml-2 font-semibold">
                          Exceeds word limit by {wordCount - wordLimit} words
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Chat area for this question */}
                  {activeChatQuestion === question.id && (
                    <div className="mt-4 border p-3 rounded-md">
                      <h5 className="text-sm font-medium mb-2">Adviseek AI Assistant</h5>
                      <ScrollArea className="h-60 mb-4 border rounded-md p-2">
                        <div className="space-y-3">
                          {chatMessages[question.id]?.map((msg, i) => (
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
                          {aiLoading && activeChatQuestion === question.id && (
                            <div className="p-3 rounded-lg bg-muted text-foreground mr-8">
                              <p className="mb-1 text-xs font-medium">Adviseek</p>
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <p className="text-sm">Thinking...</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                      
                      <div className="flex gap-2">
                        <Textarea
                          value={chatMessages[question.id]?.inputValue || ""}
                          onChange={(e) => setChatMessages(prev => ({
                            ...prev,
                            [question.id]: [...(prev[question.id] || [])],
                            inputValue: e.target.value
                          }))}
                          placeholder="Ask Adviseek about your response..."
                          className="flex-1 resize-none text-sm min-h-[60px]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              const inputValue = chatMessages[question.id]?.inputValue || "";
                              if (inputValue.trim()) {
                                setChatMessages(prev => {
                                  const newState = {...prev};
                                  delete newState[question.id].inputValue;
                                  return newState;
                                });
                                sendChatMessage(question.id, question.text, inputValue);
                              }
                            }
                          }}
                        />
                        <Button
                          onClick={() => {
                            const inputValue = chatMessages[question.id]?.inputValue || "";
                            if (inputValue.trim()) {
                              setChatMessages(prev => {
                                const newState = {...prev};
                                delete newState[question.id].inputValue;
                                return newState;
                              });
                              sendChatMessage(question.id, question.text, inputValue);
                            }
                          }}
                          disabled={aiLoading || !(chatMessages[question.id]?.inputValue || "").trim()}
                          className="self-end"
                          size="sm"
                        >
                          {aiLoading && activeChatQuestion === question.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <span>Send</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
            
            <Button 
              onClick={handleSaveResponses} 
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : t("apply.save_responses", "Save Responses")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
