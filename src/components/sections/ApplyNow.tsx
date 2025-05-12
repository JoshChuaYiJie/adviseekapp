
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
  UniversityData,
  Major
} from "@/utils/universityDataUtils";
import { Card } from "@/components/ui/card";

export const ApplyNow = () => {
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [universityData, setUniversityData] = useState<UniversityData | null>(null);
  const [availableDegrees, setAvailableDegrees] = useState<string[]>([]);
  const [availableMajors, setAvailableMajors] = useState<Major[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isCurrentlyDark } = useTheme();
  const { t } = useTranslation();

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

  const handleUniversityChange = (university: string) => {
    console.log(`University selected: ${university}`);
    setSelectedUniversity(university);
    setSelectedDegree("");
    setSelectedMajor("");
    setQuestions([]);
  };

  const handleDegreeChange = (degree: string) => {
    console.log(`Degree selected: ${degree}`);
    setSelectedDegree(degree);
    setSelectedMajor("");
    setQuestions([]);
  };

  const handleMajorChange = (major: string) => {
    console.log(`Major selected: ${major}`);
    setSelectedMajor(major);
    
    // Load application questions for this programme
    // This is a placeholder, you would typically fetch these from an API
    const sampleQuestions = [
      t("apply.questions.interest", "Why are you interested in this programme?"),
      t("apply.questions.challenge", "Describe a challenge you've overcome that demonstrates your suitability for this field."),
      t("apply.questions.goals", "What are your career goals and how will this programme help you achieve them?"),
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
    toast.success(t("apply.responses_saved", "Your responses have been saved!"));
  };

  return (
    <div className="w-full h-full space-y-6">
      <div className={`mb-8 p-6 ${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow w-full`}>
        <h3 className="text-lg font-semibold mb-2">{t("apply.select_header", "Select University and Programme")}</h3>
        
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
              <label className="block text-sm font-medium mb-1">{t("apply.programme", "Programme")}</label>
              <Select 
                value={selectedMajor}
                onValueChange={handleMajorChange}
                data-tutorial="program-select"
                disabled={isLoading || !availableMajors.length}
              >
                <SelectTrigger className={`w-full ${isCurrentlyDark ? 'bg-gray-700 text-white border-gray-600' : ''}`}>
                  <SelectValue placeholder={isLoading ? "Loading..." : t("apply.select_programme", "Select Programme")} />
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

      {questions.length > 0 && (
        <div data-tutorial="application-questions" className={`${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white'} p-6 rounded-lg shadow w-full`}>
          <h3 className="text-lg font-semibold mb-4">{t("apply.questions_header", "Application Questions")}</h3>
          
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
                  placeholder={t("apply.response_placeholder", "Type your response here...")}
                />
              </Card>
            ))}
            
            <Button onClick={handleSaveResponses}>
              {t("apply.save_responses", "Save Responses")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
