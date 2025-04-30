
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";

export const ApplyNow = () => {
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedProgramme, setSelectedProgramme] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const { isCurrentlyDark } = useTheme();

  const universities = ["National University of Singapore", "Nanyang Technological University", "Singapore Management University"];
  
  const programmes: Record<string, string[]> = {
    "National University of Singapore": ["Computer Science", "Business Administration", "Medicine"],
    "Nanyang Technological University": ["Engineering", "Communication Studies", "Biological Sciences"],
    "Singapore Management University": ["Business", "Law", "Information Systems"],
  };

  const handleUniversityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const university = e.target.value;
    setSelectedUniversity(university);
    setSelectedProgramme("");
    setQuestions([]);
  };

  const handleProgrammeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const programme = e.target.value;
    setSelectedProgramme(programme);
    
    // Load application questions for this programme
    // This is a placeholder, you would typically fetch these from an API
    const sampleQuestions = [
      "Why are you interested in this programme?",
      "Describe a challenge you've overcome that demonstrates your suitability for this field.",
      "What are your career goals and how will this programme help you achieve them?",
    ];
    
    setQuestions(sampleQuestions);
    
    // Initialize responses for these questions
    const initialResponses: Record<string, string> = {};
    sampleQuestions.forEach(q => {
      initialResponses[q] = "";
    });
    setResponses(initialResponses);
  };

  const handleResponseChange = (question: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [question]: value
    }));
  };

  const handleSaveResponses = () => {
    // Here you would typically save the responses to your database
    console.log("Saved responses:", responses);
    alert("Your responses have been saved!");
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className={`mb-8 p-6 ${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow w-full`}>
        <h3 className="text-lg font-semibold mb-2">Select University and Programme</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">University</label>
            <select 
              value={selectedUniversity}
              onChange={handleUniversityChange}
              className={`w-full border rounded p-2 ${isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : ''}`}
              data-tutorial="university-select"
            >
              <option value="">Select University</option>
              {universities.map(uni => (
                <option key={uni} value={uni}>{uni}</option>
              ))}
            </select>
          </div>
          
          {selectedUniversity && (
            <div>
              <label className="block text-sm font-medium mb-1">Programme</label>
              <select 
                value={selectedProgramme}
                onChange={handleProgrammeChange}
                className={`w-full border rounded p-2 ${isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : ''}`}
                data-tutorial="program-select"
              >
                <option value="">Select Programme</option>
                {programmes[selectedUniversity]?.map(prog => (
                  <option key={prog} value={prog}>{prog}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {questions.length > 0 && (
        <div data-tutorial="application-questions" className={`${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} p-6 rounded-lg shadow w-full`}>
          <h3 className="text-lg font-semibold mb-4">Application Questions</h3>
          
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
