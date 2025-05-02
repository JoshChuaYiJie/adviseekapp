
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";

interface MockInterviewsProps {
  user: any;
}

export const MockInterviews = ({ user }: MockInterviewsProps) => {
  const [selectedApplication, setSelectedApplication] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const { isCurrentlyDark } = useTheme();
  const { t } = useTranslation();

  // This would typically come from your database based on user's applied programmes
  const applications = [
    { id: "default", university: "NUS", programme: "Computer Science", resume: "Default NUS Application" },
    { id: "2", university: "NTU", programme: "Business", resume: "Resume_Business.pdf" },
    { id: "3", university: "SMU", programme: "Information Systems", resume: "Resume_IS.pdf" },
  ];

  const handleApplicationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const applicationId = e.target.value;
    setSelectedApplication(applicationId);
    
    if (applicationId) {
      // Fetch interview questions based on the selected application
      // This would typically come from your AI or database
      const sampleQuestions = [
        t("interview.questions.programming", "Tell me about your experience with programming languages."),
        t("interview.questions.teamwork", "How do you approach problem-solving in a team environment?"),
        t("interview.questions.motivation", "What motivated you to apply for this programme?"),
        t("interview.questions.challenge", "Describe a challenging project you've worked on and how you overcame obstacles.")
      ];
      
      setQuestions(sampleQuestions);
      
      // Initialize responses for these questions or load existing ones
      // For demo purposes we'll initialize them as empty
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

  const handleSaveResponses = () => {
    // Here you would typically save the responses to your database
    console.log("Saved interview responses:", responses);
    alert(t("interview.responses_saved", "Your responses have been saved!"));
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className={`mb-8 p-6 ${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow w-full`}>
        <h3 className="text-lg font-semibold mb-2">{t("interview.select_application", "Select Application")}</h3>
        
        <select 
          value={selectedApplication}
          onChange={handleApplicationChange}
          className={`w-full border rounded p-2 ${isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white'}`}
          data-tutorial="program-select-interview"
        >
          <option value="">{t("interview.select_option", "Select an application")}</option>
          {applications.map(app => (
            <option key={app.id} value={app.id}>
              {t(`universities.${app.university.toLowerCase()}`, app.university)} - {t(`programmes.${app.programme.replace(/\s+/g, '_').toLowerCase()}`, app.programme)} ({app.resume})
            </option>
          ))}
        </select>
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
