import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface MockInterviewsProps {
  user: any;
}

export const MockInterviews = ({ user }: MockInterviewsProps) => {
  const [selectedApplication, setSelectedApplication] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});

  // This would typically come from your database based on user's applied programmes
  const applications = [
    { id: "1", university: "NUS", programme: "Computer Science", resume: "Resume_CS.pdf" },
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
        "Tell me about your experience with programming languages.",
        "How do you approach problem-solving in a team environment?",
        "What motivated you to apply for this programme?",
        "Describe a challenging project you've worked on and how you overcame obstacles."
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
    alert("Your responses have been saved!");
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Select Application</h3>
        
        <select 
          value={selectedApplication}
          onChange={handleApplicationChange}
          className="w-full border rounded p-2"
          data-tutorial="program-select-interview"
        >
          <option value="">Select an application</option>
          {applications.map(app => (
            <option key={app.id} value={app.id}>
              {app.university} - {app.programme} ({app.resume})
            </option>
          ))}
        </select>
      </div>

      {questions.length > 0 && (
        <div data-tutorial="interview-questions">
          <h3 className="text-lg font-semibold mb-4">Potential Interview Questions</h3>
          
          <div className="space-y-6">
            {questions.map((question, index) => (
              <Card key={index} className="p-4">
                <h4 className="font-medium mb-2">{question}</h4>
                <textarea 
                  className="w-full border rounded p-2 min-h-[100px]"
                  value={responses[question] || ""}
                  onChange={(e) => handleResponseChange(question, e.target.value)}
                  placeholder="Type your response here..."
                />
              </Card>
            ))}
            
            <Button onClick={handleSaveResponses}>
              Save Responses
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
