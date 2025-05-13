import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { QuizSegments } from "./QuizSegments";
import { RiasecChart } from "./RiasecChart";
import { WorkValuesChart } from "./WorkValuesChart";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import { MyResume } from "./MyResume";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { UserProfileDisplay } from "./majors/UserProfileDisplay";
import { mapRiasecToCode, mapWorkValueToCode, formCode, getMatchingMajors } from '@/utils/recommendation';
import { processRiasecData } from '@/components/sections/RiasecChart';
import { processWorkValuesData } from '@/components/sections/WorkValuesChart';
import { Badge } from "@/components/ui/badge";
export const AboutMe = () => {
  const [activeTab, setActiveTab] = useState<"quiz" | "profile" | "resume">("quiz");
  const [riasecCode, setRiasecCode] = useState<string>("");
  const [workValueCode, setWorkValueCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [recommendedMajors, setRecommendedMajors] = useState<{
    exactMatches: string[];
    permutationMatches: string[];
    riasecMatches: string[];
    workValueMatches: string[];
    matchType: string;
  }>({
    exactMatches: [],
    permutationMatches: [],
    riasecMatches: [],
    workValueMatches: [],
    matchType: 'none'
  });
  const navigate = useNavigate();
  const {
    isCurrentlyDark
  } = useTheme();

  // New state for dynamic profile information
  const [profileInfo, setProfileInfo] = useState({
    strengths: [] as string[],
    workPreferences: [] as string[]
  });
  useEffect(() => {
    const loadUserProfiles = async () => {
      try {
        setIsLoading(true);

        // Get current user
        const {
          data: {
            session
          }
        } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) {
          console.log("No user ID found");
          setIsLoading(false);
          return;
        }
        console.log(`Loading user profiles for ${userId}`);

        // Get RIASEC data from chart processing function
        const riasecChartData = await processRiasecData(userId);

        // Get Work Values data from chart processing function
        const workValuesChartData = await processWorkValuesData(userId);
        console.log("RIASEC data:", riasecChartData);
        console.log("Work Value data:", workValuesChartData);
        let generatedRiasecCode = "";
        let generatedWorkValueCode = "";

        // Generate RIASEC code if data exists
        if (riasecChartData && riasecChartData.length > 0) {
          // Format data for code generation
          const formattedRiasecData = riasecChartData.map(item => ({
            component: item.name,
            average: 0,
            score: item.value
          }));
          generatedRiasecCode = formCode(formattedRiasecData, mapRiasecToCode);
          setRiasecCode(generatedRiasecCode || "RSI");
        } else {
          // Fallback if no data
          generatedRiasecCode = "RSI";
          setRiasecCode("RSI");
        }

        // Generate Work Values code if data exists
        if (workValuesChartData && workValuesChartData.length > 0) {
          // Format data for code generation
          const formattedWorkValuesData = workValuesChartData.map(item => ({
            component: item.name,
            average: 0,
            score: item.value
          }));
          generatedWorkValueCode = formCode(formattedWorkValuesData, mapWorkValueToCode);
          setWorkValueCode(generatedWorkValueCode || "ARS");
        } else {
          // Fallback if no data
          generatedWorkValueCode = "ARS";
          setWorkValueCode("ARS");
        }

        // Generate dynamic profile information based on RIASEC and Work Values
        const dynamicStrengths = generateStrengthsFromRIASEC(generatedRiasecCode);
        const dynamicWorkPreferences = generateWorkPreferencesFromWorkValues(generatedWorkValueCode);
        setProfileInfo({
          strengths: dynamicStrengths,
          workPreferences: dynamicWorkPreferences
        });
        console.log("Final RIASEC profile state:", riasecChartData);
        console.log("Final Work Value profile state:", workValuesChartData);

        // Get completed quiz segments from database
        const {
          data: completions
        } = await supabase.from('quiz_completion').select('quiz_type').eq('user_id', userId);
        if (completions) {
          const completedSegments = completions.map(c => c.quiz_type);
          console.log("Completed quiz segments from database:", completedSegments);
        }

        // Fetch recommended majors based on the profile codes
        if (generatedRiasecCode && generatedWorkValueCode) {
          const majorRecommendations = await getMatchingMajors(generatedRiasecCode, generatedWorkValueCode);
          console.log("Recommended majors:", majorRecommendations);
          setRecommendedMajors(majorRecommendations);
        }
      } catch (error) {
        console.error("Error loading user profiles:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserProfiles();
  }, []);

  // New function to generate strengths based on RIASEC code
  const generateStrengthsFromRIASEC = (code: string): string[] => {
    const strengths: Record<string, string[]> = {
      'R': ['Strong mechanical and technical abilities', 'Good at working with tools, machines, and equipment', 'Practical problem-solving skills', 'Physical coordination and dexterity'],
      'I': ['Analytical thinking and problem-solving', 'Research and investigation skills', 'Abstract reasoning abilities', 'Scientific approach to challenges'],
      'A': ['Creative and artistic expression', 'Innovative thinking and imagination', 'Attention to aesthetics and design', 'Self-expression and originality'],
      'S': ['Strong interpersonal and communication skills', 'Empathetic understanding of others', 'Teaching and mentoring abilities', 'Collaborative teamwork skills'],
      'E': ['Leadership and decision-making abilities', 'Persuasive communication and negotiation', 'Strategic thinking and initiative', 'Business acumen and organizational skills'],
      'C': ['Detail-oriented with good organizational abilities', 'Data management and record-keeping skills', 'Systematic approach to tasks', 'Attention to accuracy and precision']
    };

    // Get the top 2-3 letters from the code
    const topLetters = code.slice(0, Math.min(3, code.length));

    // Collect strengths for each letter in the code
    const result: string[] = [];
    for (const letter of topLetters) {
      if (strengths[letter]) {
        // Add 1-2 strengths from each letter category
        const categoryStrengths = strengths[letter];
        const randomStrength = categoryStrengths[Math.floor(Math.random() * categoryStrengths.length)];
        result.push(randomStrength);
      }
    }

    // Ensure we have at least 4 strengths, filling in from other categories if needed
    while (result.length < 4) {
      const remainingLetters = 'RIASEC'.split('').filter(l => !topLetters.includes(l));
      if (remainingLetters.length === 0) break;
      const randomLetter = remainingLetters[Math.floor(Math.random() * remainingLetters.length)];
      const categoryStrengths = strengths[randomLetter];
      const randomStrength = categoryStrengths[Math.floor(Math.random() * categoryStrengths.length)];
      if (!result.includes(randomStrength)) {
        result.push(randomStrength);
      }
    }
    return result;
  };

  // New function to generate work preferences based on Work Values code
  const generateWorkPreferencesFromWorkValues = (code: string): string[] => {
    const preferences: Record<string, string[]> = {
      'A': ['Recognition for contributions and achievements', 'Opportunities to demonstrate expertise and excellence', 'Environment that values individual accomplishment', 'Merit-based advancement and rewards'],
      'R': ['Opportunities for continuous learning', 'Intellectual challenges and stimulation', 'Research and analysis responsibilities', 'Exploration of new concepts and ideas'],
      'S': ['Stable and secure work environment', 'Clear expectations and consistent routines', 'Predictable schedules and responsibilities', 'Long-term employment opportunities'],
      'I': ['Independence in decision-making', 'Self-directed work arrangements', 'Autonomy in task management', 'Freedom to innovate and create'],
      'E': ['Opportunities to influence organizational decisions', 'Leadership roles and responsibilities', 'Management of people and projects', 'Strategic planning and direction setting'],
      'W': ['Collaborative team settings', 'Social interaction with colleagues', 'Supportive and friendly workplace culture', 'Opportunities to help and mentor others']
    };

    // Get the top 2-3 letters from the code
    const topLetters = code.slice(0, Math.min(3, code.length));

    // Collect preferences for each letter in the code
    const result: string[] = [];
    for (const letter of topLetters) {
      if (preferences[letter]) {
        // Add 1-2 preferences from each letter category
        const categoryPrefs = preferences[letter];
        const randomPref = categoryPrefs[Math.floor(Math.random() * categoryPrefs.length)];
        result.push(randomPref);
      }
    }

    // Ensure we have at least 4 preferences, filling in from other categories if needed
    while (result.length < 4) {
      const remainingLetters = 'ARSIEW'.split('').filter(l => !topLetters.includes(l));
      if (remainingLetters.length === 0) break;
      const randomLetter = remainingLetters[Math.floor(Math.random() * remainingLetters.length)];
      const categoryPrefs = preferences[randomLetter];
      const randomPref = categoryPrefs[Math.floor(Math.random() * categoryPrefs.length)];
      if (!result.includes(randomPref)) {
        result.push(randomPref);
      }
    }
    return result;
  };
  const handleResumeClick = () => {
    navigate("/resumebuilder");
  };
  const handleOpenEndedQuiz = () => {
    navigate("/open-ended");
  };

  // Helper function to format major name (removes university suffix if present)
  const formatMajorName = (major: string): string => {
    return major.replace(/ at (NUS|NTU|SMU)$/, '');
  };

  // Get university from major string
  const getUniversityFromMajor = (major: string): string => {
    const match = major.match(/ at (NUS|NTU|SMU)$/);
    return match ? match[1] : '';
  };
  return <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">About Me</h2>
          <p className="text-muted-foreground">
            Complete quizzes to learn more about your interests and strengths
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant={activeTab === "quiz" ? "default" : "outline"} onClick={() => setActiveTab("quiz")}>
            Quizzes
          </Button>
          <Button variant={activeTab === "profile" ? "default" : "outline"} onClick={() => setActiveTab("profile")}>
            My Profile
          </Button>
          <Button variant={activeTab === "resume" ? "default" : "outline"} onClick={() => setActiveTab("resume")}>
            <FileText className="mr-2 h-4 w-4" />
            My Resume
          </Button>
        </div>
      </div>

      {activeTab === "quiz" ? <QuizSegments /> : activeTab === "profile" ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RiasecChart />
          <WorkValuesChart />
          
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>My Competencies and Preferences</CardTitle>
              <CardDescription>Based on your quiz responses</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
                </div> : <>
                  {/* Display profile codes */}
                  <UserProfileDisplay riasecCode={riasecCode} workValueCode={workValueCode} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Personality traits</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {profileInfo.strengths.map((strength, index) => <li key={`strength-${index}`}>{strength}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Work Environment Preferences</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {profileInfo.workPreferences.map((preference, index) => <li key={`pref-${index}`}>{preference}</li>)}
                      </ul>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  {/* Recommended Majors Section */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Recommended Majors</h3>
                    <p className="mb-4">Based on your RIASEC code ({riasecCode}) and Work Values code ({workValueCode}):</p>
                    
                    {/* Exact Matches */}
                    {recommendedMajors.exactMatches.length > 0 && <div className="mb-4">
                        <h4 className="font-medium text-md mb-2 flex items-center">
                          <Badge className="mr-2 bg-green-600">Exact Match</Badge>
                          Best match for your profile
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {recommendedMajors.exactMatches.map((major, index) => <div key={`exact-${index}`} className={`p-3 rounded-md ${isCurrentlyDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                              <p className="font-medium">{formatMajorName(major)}</p>
                              <p className="text-xs opacity-70">{getUniversityFromMajor(major) || 'University not specified'}</p>
                            </div>)}
                        </div>
                      </div>}
                    
                    {/* RIASEC Matches */}
                    {recommendedMajors.riasecMatches.length > 0 && <div className="mb-4">
                        <h4 className="font-medium text-md mb-2 flex items-center">
                          <Badge className="mr-2 bg-purple-600">RIASEC Match</Badge>
                          Matches based on your personality type
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {recommendedMajors.riasecMatches.map((major, index) => <div key={`riasec-${index}`} className={`p-3 rounded-md ${isCurrentlyDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                              <p className="font-medium">{formatMajorName(major)}</p>
                              <p className="text-xs opacity-70">{getUniversityFromMajor(major) || 'University not specified'}</p>
                            </div>)}
                        </div>
                      </div>}
                    
                    {/* Work Value Matches */}
                    {recommendedMajors.workValueMatches.length > 0 && <div className="mb-4">
                        <h4 className="font-medium text-md mb-2 flex items-center">
                          <Badge className="mr-2 bg-amber-600">Work Values Match</Badge>
                          Matches based on your work preferences
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {recommendedMajors.workValueMatches.map((major, index) => <div key={`wv-${index}`} className={`p-3 rounded-md ${isCurrentlyDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                              <p className="font-medium">{formatMajorName(major)}</p>
                              <p className="text-xs opacity-70">{getUniversityFromMajor(major) || 'University not specified'}</p>
                            </div>)}
                        </div>
                      </div>}
                    
                    {/* No matches found */}
                    {recommendedMajors.exactMatches.length === 0 && recommendedMajors.riasecMatches.length === 0 && recommendedMajors.workValueMatches.length === 0 && <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-center">
                        <p>No major recommendations found for your profile. Please complete all quizzes or contact support.</p>
                      </div>}
                  </div>
                  
                  <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900">
                    <h3 className="text-lg font-semibold mb-2">Open-ended Questions</h3>
                    <p className="mb-4">
                      Take our specialized quiz to answer questions about specific majors based on your RIASEC and Work Values profile.
                    </p>
                    <Button onClick={handleOpenEndedQuiz}>Take Open-ended Quiz</Button>
                  </div>
                </>}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" onClick={() => setActiveTab("quiz")}>Take More Quizzes</Button>
            </CardFooter>
          </Card>
        </div> : <MyResume />}
    </div>;
};