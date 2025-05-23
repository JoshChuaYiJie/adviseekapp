
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

interface EducationItem {
  id: string;
  qualifications: string;
  institution: string;
  dates: string;
}

interface WorkExperience {
  organisation?: string;
  role?: string;
  description?: string;
  date?: string;
}

interface RecommendedMajor {
  exactMatches?: string[];
  riasecMatches?: string[];
  workValueMatches?: string[];
  permutationMatches?: string[];
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

  // Rotate loading messages with proper spacing
  useInterval(() => {
    if (generatingQuestions) {
      setLoadingTextIndex((prevIndex) => (prevIndex + 1) % loadingTexts.length);
    }
  }, 2000);

  useEffect(() => {
    const fetchUserApplications = async () => {
      try {
        setLoading(true);
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;

        if (!session?.user?.id) {
          console.log("No user logged in");
          setLoading(false);
          return;
        }

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
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session?.user?.id) {
        toast.error("You must be logged in to generate interview questions");
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const { data: resumeData } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

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

      if (profileData) {
        // Safely handle recommended_major with proper type checking
        let recommendedMajor: RecommendedMajor = {};
        try {
          if (typeof profileData.recommended_major === 'string') {
            recommendedMajor = JSON.parse(profileData.recommended_major);
          } else if (profileData.recommended_major && typeof profileData.recommended_major === 'object') {
            recommendedMajor = profileData.recommended_major as RecommendedMajor;
          }
        } catch (error) {
          console.error("Error parsing recommended_major:", error);
        }

        const matches = [
          ...(recommendedMajor.exactMatches || []),
          ...(recommendedMajor.riasecMatches || []),
          ...(recommendedMajor.workValueMatches || []),
          ...(recommendedMajor.permutationMatches || []),
        ].filter(Boolean);
        const matchesString = matches.join(', ');

        let idString = `${profileData.id} (Matches: ${matchesString})`;

        if (resumeData && resumeData.length > 0 && resumeData[0].educationItems) {
          // Safely handle educationItems array
          let educationItems: any[] = [];
          try {
            if (Array.isArray(resumeData[0].educationItems)) {
              educationItems = resumeData[0].educationItems;
            } else if (typeof resumeData[0].educationItems === 'string') {
              educationItems = JSON.parse(resumeData[0].educationItems);
            }
          } catch (error) {
            console.error("Error parsing educationItems:", error);
          }

          const qualifications = educationItems
            .map((item: any) => item.qualifications)
            .filter(Boolean)
            .join(', ');
          if (qualifications) {
            idString += `; Qualifications: ${qualifications}`;
          }
        }

        prompt += `
        
        Take into account this student profile:
        - ID: ${idString}
        - RIASEC code: ${profileData.riasec_code || 'Not available'}
        - Work values: ${profileData.work_value_code || 'Not available'}
        - Likes: ${profileData.likes || 'Not available'}
        - Dislikes: ${profileData.dislikes || 'Not available'}
        `;
      }

      if (resumeData && resumeData.length > 0) {
        const resume = resumeData[0];
        
        // Safely handle educationItems
        let educationItems: any[] = [];
        try {
          if (Array.isArray(resume.educationItems)) {
            educationItems = resume.educationItems;
          } else if (typeof resume.educationItems === 'string') {
            educationItems = JSON.parse(resume.educationItems);
          }
        } catch (error) {
          console.error("Error parsing educationItems:", error);
        }

        const education = educationItems
          .map((item: any) => 
            `${item.qualifications || 'N/A'} from ${item.institution || 'N/A'}${item.dates ? ` (${item.dates})` : ''}`
          )
          .filter(Boolean)
          .join('; ') || 'Not available';

        // Safely handle awards
        let awards = 'Not available';
        try {
          if (resume.awards) {
            let awardsArray: any[] = [];
            if (Array.isArray(resume.awards)) {
              awardsArray = resume.awards;
            } else if (typeof resume.awards === 'string') {
              awardsArray = JSON.parse(resume.awards);
            }
            
            awards = awardsArray
              .map((award: any) => 
                award.title ? `${award.title}${award.date ? ` (${award.date})` : ''}` : null
              )
              .filter(Boolean)
              .join('; ') || 'Not available';
          }
        } catch (error) {
          console.error("Error parsing awards:", error);
        }

        // Safely handle work_experience
        let work_experience = 'Not available';
        try {
          if (resume.work_experience) {
            let workArray: WorkExperience[] = [];
            if (Array.isArray(resume.work_experience)) {
              workArray = resume.work_experience;
            } else if (typeof resume.work_experience === 'string') {
              workArray = JSON.parse(resume.work_experience);
            } else if (resume.work_experience && typeof resume.work_experience === 'object') {
              workArray = [resume.work_experience as WorkExperience];
            }
            
            work_experience = workArray
              .map((work: WorkExperience) => {
                if (!work.organisation && !work.role) return null;
                const parts = [];
                if (work.role) parts.push(work.role);
                if (work.organisation) parts.push(`at ${work.organisation}`);
                if (work.description) parts.push(`: ${work.description}`);
                if (work.date) parts.push(` (${work.date})`);
                return parts.join('');
              })
              .filter(Boolean)
              .join('; ') || 'Not available';
          }
        } catch (error) {
          console.error("Error parsing work_experience:", error);
        }

        prompt += `
        
        Consider this student's background:
        - Education: ${education}
        - Work experience: ${work_experience}
        - Awards: ${awards}
        - Skills: IT skills: ${resume.it_skills || 'None'}, Interests: ${resume.interests || 'None'}, Languages: ${resume.languages || 'None'}
        `;
      }

      console.log("Generating interview questions with prompt:", prompt);

      const aiResponse = await callAI(prompt);

      const questionLines = aiResponse
        .split('\n')
        .filter(line => line.trim().match(/^\d+\.\s/))
        .map(line => line.replace(/^\d+\.\s/, '').trim());

      if (questionLines.length > 0) {
        setQuestions(questionLines);
        const initialResponses: Record<string, string> = {};
        questionLines.forEach(q => {
          initialResponses[q] = "";
        });
        setResponses(initialResponses);
        console.log("Generated questions:", questionLines);
      } else {
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
      const selectedApp = userApplications.find(app => app.id === applicationId);
      if (selectedApp) {
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
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session?.user?.id) {
        toast.error("You must be logged in to save responses");
        return;
      }

      const selectedApp = userApplications.find(app => app.id === selectedApplication);
      if (!selectedApp) {
        toast.error("Selected application not found");
        return;
      }

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
            <span className="text-lg">
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
            </span>
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
