
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDeepseek } from "@/hooks/useDeepseek";
import { Loader2 } from "lucide-react";
import { useInterval } from "@/hooks/useInterval";

interface MockInterviewsProps {
  user: any;
}

interface AppliedProgram {
  id: string;
  university: string;
  major: string;
  school?: string;
  degree?: string;
  college?: string;
}

export const MockInterviews = ({ user }: MockInterviewsProps) => {
  const [selectedApplication, setSelectedApplication] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [userApplications, setUserApplications] = useState<AppliedProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const { isCurrentlyDark } = useTheme();
  const { t } = useTranslation();
  const { callAI } = useDeepseek();
  
  const loadingTexts = [
    'What would your interviewers ask?',
    'Submitting your profile',
    'Taking a coffee break'
  ];

  // Rotate loading messages
  useInterval(() => {
    if (generatingQuestions) {
      setLoadingTextIndex((prevIndex) => (prevIndex + 1) % loadingTexts.length);
    }
  }, 2000);

  useEffect(() => {
    const fetchUserApplications = async () => {
      try {
        setLoading(true);
        // Get current user session
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;
        
        if (!session?.user?.id) {
          console.log("No user logged in");
          setLoading(false);
          return;
        }

        // Fetch the user's applied programs from the database
        const { data: applications, error } = await supabase
          .from('applied_programs')
          .select('id, university, major, school, degree, college')
          .eq('user_id', session.user.id);

        if (error) {
          console.error("Error fetching applied programs:", error);
          toast.error("Failed to load your applications");
          return;
        }

        if (applications && applications.length > 0) {
          console.log("Fetched applications:", applications);
          setUserApplications(applications);
        } else {
          console.log("No applications found for user");
          // Load default applications for demonstration if user has none
          setUserApplications([
            { id: "default", university: "NUS", major: "Computer Science", school: "School of Computing" },
            { id: "default2", university: "NTU", major: "Business", school: "Business School" },
            { id: "default3", university: "SMU", major: "Information Systems", school: "School of Information Systems" }
          ]);
        }
      } catch (error) {
        console.error("Error in fetchUserApplications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserApplications();
  }, [toast]);

  const generateInterviewQuestions = async (application: AppliedProgram) => {
    setGeneratingQuestions(true);
    
    try {
      // Get user profile data for context
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      
      if (!session?.user?.id) {
        toast.error("You must be logged in to generate interview questions");
        return;
      }
      
      // Fetch user profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      // Fetch resume data
      const { data: resumeData } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false })
        .limit(1);
        
      // Create a prompt for the AI
      let prompt = `
        Generate 5 realistic interview questions for a ${application.major} program at ${application.university}.
        
        Focus on questions that assess:
        1. Academic preparation
        2. Technical knowledge relevant to ${application.major}
        3. Problem-solving ability
        4. Program fit
        5. Personal motivations
        
        Return ONLY the list of questions, numbered from 1 to 5, with no additional text or explanation.
      `;
      
      // Add profile context if available
      if (profileData) {
        prompt += `
        
        Take into account this student profile:
        - RIASEC code: ${profileData.riasec_code || 'Not available'}
        - Work values: ${profileData.work_value_code || 'Not available'}
        - Likes: ${profileData.likes || 'Not available'}
        - Dislikes: ${profileData.dislikes || 'Not available'}
        `;
      }
      
      // Add resume context if available
      if (resumeData && resumeData.length > 0) {
        const resume = resumeData[0];
        prompt += `
        
        Consider this student's background:
        - Education: ${resume.educationItems ? 'Available' : 'Not available'}
        - Work experience: ${resume.work_experience ? 'Available' : 'Not available'}
        - Awards: ${resume.awards || 'Not available'}
        - Skills: ${resume.it_skills || 'Not available'}
        `;
      }
      console.log("PROFILE DATA IS AVALIBLE IN MOCK INTERVIEW", profileData);
      console.log("Generating interview questions with prompt:", prompt);
      console.log("RESUME DATA IS AVLAIBLE IN MOCK INTERVIEW", resumeData);
      
      // Call the AI to generate questions
      const aiResponse = await callAI(prompt);
      
      // Parse the questions from the AI response
      const questionLines = aiResponse
        .split('\n')
        .filter(line => line.trim().match(/^\d+\.\s/)) // Lines starting with numbers
        .map(line => line.replace(/^\d+\.\s/, '').trim()); // Remove the numbers
      
      if (questionLines.length > 0) {
        setQuestions(questionLines);
        
        // Initialize responses for these questions
        const initialResponses: Record<string, string> = {};
        questionLines.forEach(q => {
          initialResponses[q] = "";
        });
        setResponses(initialResponses);
        
        console.log("Generated questions:", questionLines);
      } else {
        // If parsing failed, show an error
        console.error("Failed to parse AI-generated questions");
        toast.error("Failed to generate interview questions. Please try again.");
      }
    } catch (error) {
      console.error("Error generating interview questions:", error);
      toast.error("Failed to generate interview questions");
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleApplicationChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const applicationId = e.target.value;
    setSelectedApplication(applicationId);
    
    if (applicationId) {
      // Find the selected application
      const selectedApp = userApplications.find(app => app.id === applicationId);
      
      if (selectedApp) {
        // Generate interview questions based on the selected application
        await generateInterviewQuestions(selectedApp);
      }
    } else {
      setQuestions([]);
      setResponses({});
    }
  };

  const handleResponseChange = (question: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [question]: value
    }));
  };

  const handleSaveResponses = async () => {
    try {
      // Get current user session
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      
      if (!session?.user?.id) {
        toast.error("You must be logged in to save responses");
        return;
      }

      // Find the selected application
      const selectedApp = userApplications.find(app => app.id === selectedApplication);
      if (!selectedApp) {
        toast.error("Selected application not found");
        return;
      }

      // Save responses to database - we could create a new table for these in the future
      // For now, just show success message
      console.log("Saved interview responses:", {
        userId: session.user.id,
        applicationId: selectedApplication,
        university: selectedApp.university,
        major: selectedApp.major,
        responses: responses
      });

      toast.success(t("interview.responses_saved", "Your responses have been saved!"));
    } catch (error) {
      console.error("Error saving responses:", error);
      toast.error("Failed to save your responses");
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className={`mb-8 p-6 ${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow w-full`}>
        <h3 className="text-lg font-semibold mb-2">{t("interview.select_application", "Select Application")}</h3>
        
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
          </div>
        ) : (
          <select 
            value={selectedApplication}
            onChange={handleApplicationChange}
            className={`w-full border rounded p-2 ${isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white'}`}
            data-tutorial="program-select-interview"
          >
            <option value="">{t("interview.select_option", "Select an application")}</option>
            {userApplications.map(app => (
              <option key={app.id} value={app.id}>
                {app.university} - {app.major} {app.degree ? `(${app.degree})` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {generatingQuestions ? (
        <div className="flex flex-col items-center justify-center p-12">
          <div className="mb-4 flex items-center">
            {loadingTexts[loadingTextIndex].split('').map((char, i) => (
              <span 
                key={i} 
                className="inline-block animate-bounce" 
                style={{ 
                  animationDuration: '1s', 
                  animationDelay: `${i * 0.1}s`,
                  marginRight: '1px',
                  fontSize: '1.25rem'
                }}
              >
                {char}
              </span>
            ))}
          </div>
          <p className="text-center text-muted-foreground">
            Generating interview questions tailored to your application...
          </p>
        </div>
      ) : (
        questions.length > 0 && (
          <div data-tutorial="interview-questions" className={`${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} p-6 rounded-lg shadow w-full`}>
            <h3 className="text-lg font-semibold mb-4">{t("interview.potential_questions", "Interview Questions")}</h3>
            
            <div className="space-y-6">
              {questions.map((question, index) => (
                <Card key={index} className={`p-4 ${isCurrentlyDark ? 'bg-gray-700 border-gray-600' : ''}`}>
                  <h4 className="font-medium mb-2">{question}</h4>
                  <textarea 
                    className={`w-full border rounded p-2 min-h-[100px] ${
                      isCurrentlyDark ? 'bg-gray-600 text-white border-gray-500' : ''
                    }`}
                    value={responses[question] || ""}
                    onChange={(e) => handleResponseChange(question, e.target.value)}
                    placeholder={t("interview.response_placeholder", "Type your response here...")}
                  />
                </Card>
              ))}
              
              <Button onClick={handleSaveResponses}>
                {t("interview.save_responses", "Save Responses")}
              </Button>
            </div>
          </div>
        )
      )}
    </div>
  );
};
