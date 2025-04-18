
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

interface Programme {
  school: string;
  course: string;
  id: number;
}

interface Resume {
  id: number;
  name: string;
}

interface Question {
  id: number;
  question: string;
  response?: string;
}

interface MockInterviewsProps {
  user: any;
}

export const MockInterviews = ({ user }: MockInterviewsProps) => {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedProgramme, setSelectedProgramme] = useState("");
  const [selectedResume, setSelectedResume] = useState("");
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  // Fetch applied programmes
  useEffect(() => {
    const fetchProgrammes = async () => {
      try {
        // In a real app, this would fetch from the database
        // For now, using mock data
        setProgrammes([
          { id: 1, school: "NUS", course: "Computer Science" },
          { id: 2, school: "NTU", course: "Data Science" },
          { id: 3, school: "SMU", course: "Business Analytics" },
        ]);
      } catch (error) {
        console.error("Error fetching programmes:", error);
      }
    };

    fetchProgrammes();
  }, [user.id]);

  // Fetch resumes when a programme is selected
  useEffect(() => {
    const fetchResumes = async () => {
      if (!selectedProgramme) return;
      
      try {
        // In a real app, this would fetch from the database
        setResumes([
          { id: 1, name: "Tech Resume" },
          { id: 2, name: "General Resume" },
        ]);
      } catch (error) {
        console.error("Error fetching resumes:", error);
      }
    };

    fetchResumes();
  }, [selectedProgramme]);

  // Fetch interview questions when both programme and resume are selected
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!selectedProgramme || !selectedResume) return;
      
      setLoading(true);
      try {
        // In a real app, this would fetch from the database
        // For now, using mock data
        const mockQuestions = [
          { id: 1, question: "Tell me about yourself and why you're interested in this programme." },
          { id: 2, question: "What experience do you have that makes you a good fit for this course?" },
          { id: 3, question: "How would you contribute to the university community?" },
          { id: 4, question: "Describe a challenging project you've worked on." },
        ];
        
        // Fetch saved responses
        const mockResponses: Record<number, string> = {};
        // In a real app, fetch saved responses from database
        
        setQuestions(mockQuestions);
        setResponses(mockResponses);
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [selectedProgramme, selectedResume]);

  const handleResponseChange = (questionId: number, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const saveResponses = async () => {
    try {
      // In a real app, save to the database
      // await supabase.from('interview_responses').upsert([...]);
      
      toast({
        title: "Responses saved",
        description: "Your interview responses have been saved successfully",
      });
    } catch (error) {
      console.error("Error saving responses:", error);
      toast({
        title: "Error saving responses",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Mock Interview Preparation</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Programme</label>
            <Select value={selectedProgramme} onValueChange={setSelectedProgramme}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a programme" />
              </SelectTrigger>
              <SelectContent>
                {programmes.map((prog) => (
                  <SelectItem key={prog.id} value={prog.id.toString()}>
                    {prog.school} - {prog.course}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedProgramme && (
            <div>
              <label className="block text-sm font-medium mb-1">Select Resume</label>
              <Select value={selectedResume} onValueChange={setSelectedResume}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a resume" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id.toString()}>
                      {resume.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && questions.length > 0 && (
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Potential Interview Questions</h3>
          <div className="space-y-6">
            {questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <p className="font-medium">{question.question}</p>
                <Textarea 
                  value={responses[question.id] || ""}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  placeholder="Type your response here..."
                  className="min-h-[120px]"
                />
              </div>
            ))}
            <Button onClick={saveResponses}>Save Responses</Button>
          </div>
        </div>
      )}

      {!loading && selectedProgramme && selectedResume && questions.length === 0 && (
        <div className="p-6 bg-white rounded-lg shadow text-center">
          <p>No questions found for this programme and resume combination.</p>
        </div>
      )}
    </div>
  );
};
