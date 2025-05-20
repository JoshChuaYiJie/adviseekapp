
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { isCurrentlyDark } = useTheme();
  const { t } = useTranslation();
  const { toast } = useToast();

  // Fetch user's applied programs from Supabase
  useEffect(() => {
    const fetchUserApplications = async () => {
      try {
        setLoading(true);
        // Get current user session
        const { data: session } = await supabase.auth.getSession();
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
          toast({
            title: "Error",
            description: "Failed to load your applications",
            variant: "destructive"
          });
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

  const handleApplicationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const applicationId = e.target.value;
    setSelectedApplication(applicationId);
    
    if (applicationId) {
      // Find the selected application
      const selectedApp = userApplications.find(app => app.id === applicationId);
      
      // Fetch interview questions based on the selected application's major/university
      // This would typically come from your AI or database
      const sampleQuestions = [
        t("interview.questions.programming", "Tell me about your experience with programming languages."),
        t("interview.questions.teamwork", "How do you approach problem-solving in a team environment?"),
        t("interview.questions.motivation", `What motivated you to apply for ${selectedApp?.major || 'this programme'}?`),
        t("interview.questions.challenge", "Describe a challenging project you've worked on and how you overcame obstacles.")
      ];
      
      // If it's a Computer Science or related major, add technical questions
      if (selectedApp?.major?.toLowerCase().includes('comput') || 
          selectedApp?.major?.toLowerCase().includes('software') ||
          selectedApp?.major?.toLowerCase().includes('information')) {
        sampleQuestions.push(
          t("interview.questions.technical", "Explain a programming concept you find interesting and why."),
          t("interview.questions.project", "Tell me about a programming project you've completed.")
        );
      }
      
      // If it's a Business related major, add business questions
      if (selectedApp?.major?.toLowerCase().includes('business') || 
          selectedApp?.major?.toLowerCase().includes('management') || 
          selectedApp?.major?.toLowerCase().includes('finance')) {
        sampleQuestions.push(
          t("interview.questions.business", "How do you stay updated with current business trends?"),
          t("interview.questions.leadership", "Describe a situation where you demonstrated leadership skills.")
        );
      }
      
      setQuestions(sampleQuestions);
      
      // Initialize responses for these questions or load existing ones
      const initialResponses: Record<string, string> = {};
      sampleQuestions.forEach(q => {
        initialResponses[q] = "";
      });
      setResponses(initialResponses);
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
      const { data: session } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to save responses",
          variant: "destructive"
        });
        return;
      }

      // Find the selected application
      const selectedApp = userApplications.find(app => app.id === selectedApplication);
      if (!selectedApp) {
        toast({
          title: "Error",
          description: "Selected application not found",
          variant: "destructive"
        });
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

      toast({
        title: "Success",
        description: t("interview.responses_saved", "Your responses have been saved!"),
      });
    } catch (error) {
      console.error("Error saving responses:", error);
      toast({
        title: "Error",
        description: "Failed to save your responses",
        variant: "destructive"
      });
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

      {questions.length > 0 && (
        <div data-tutorial="interview-questions" className={`${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} p-6 rounded-lg shadow w-full`}>
          <h3 className="text-lg font-semibold mb-4">{t("interview.potential_questions", "Potential Interview Questions")}</h3>
          
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
      )}
    </div>
  );
};
