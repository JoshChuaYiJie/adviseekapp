
import { useState, useEffect } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

interface Programme {
  id: string;
  name: string;
}

interface Question {
  id: number;
  question: string;
  response?: string;
}

export const ApplyNow = () => {
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedProgramme, setSelectedProgramme] = useState("");
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  // Fetch programmes when university is selected
  useEffect(() => {
    if (!selectedUniversity) return;
    
    const fetchProgrammes = async () => {
      try {
        // Mock data - in a real app, this would be fetched from a database
        const mockProgrammes = [
          { id: "cs", name: "Computer Science" },
          { id: "ds", name: "Data Science" },
          { id: "ba", name: "Business Analytics" },
          { id: "fin", name: "Finance" },
        ];
        setProgrammes(mockProgrammes);
      } catch (error) {
        console.error("Error fetching programmes:", error);
      }
    };

    fetchProgrammes();
  }, [selectedUniversity]);

  // Fetch questions when programme is selected
  useEffect(() => {
    if (!selectedProgramme) return;
    
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        // Mock data - in a real app, this would be fetched from a database
        const mockQuestions = [
          { id: 1, question: "Why are you interested in this programme?" },
          { id: 2, question: "Describe a project that demonstrates your skills relevant to this programme." },
          { id: 3, question: "How do you plan to contribute to the university community?" },
          { id: 4, question: "What are your career goals after completing this programme?" },
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
  }, [selectedProgramme]);

  const handleResponseChange = (questionId: number, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const saveResponses = async () => {
    try {
      // In a real app, save to the database
      // await supabase.from('application_responses').upsert([...]);
      
      toast({
        title: "Responses saved",
        description: "Your application responses have been saved successfully",
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
      <div className="space-y-4">
        <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a university" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NUS">NUS</SelectItem>
            <SelectItem value="NTU">NTU</SelectItem>
            <SelectItem value="SMU">SMU</SelectItem>
          </SelectContent>
        </Select>
        
        {selectedUniversity && (
          <div className="space-y-4">
            <Select value={selectedProgramme} onValueChange={setSelectedProgramme}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a programme" />
              </SelectTrigger>
              <SelectContent>
                {programmes.map((prog) => (
                  <SelectItem key={prog.id} value={prog.id}>
                    {prog.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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
          <h3 className="text-lg font-medium mb-4">Application Questions</h3>
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
            <Button onClick={saveResponses}>Save Application</Button>
          </div>
        </div>
      )}
    </div>
  );
};
