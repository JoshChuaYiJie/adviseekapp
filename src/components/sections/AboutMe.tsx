
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
import { 
  mapRiasecToCode, 
  mapWorkValueToCode, 
  formCode,
  getMatchingMajors 
} from '@/utils/recommendation';
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
  const { isCurrentlyDark } = useTheme();

  useEffect(() => {
    const loadUserProfiles = async () => {
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
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
        
        console.log("Final RIASEC profile state:", riasecChartData);
        console.log("Final Work Value profile state:", workValuesChartData);
        
        // Get completed quiz segments from database
        const { data: completions } = await supabase
          .from('quiz_completion')
          .select('quiz_type')
          .eq('user_id', userId);
          
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">About Me</h2>
          <p className="text-muted-foreground">
            Complete quizzes to learn more about your interests and strengths
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={activeTab === "quiz" ? "default" : "outline"} 
            onClick={() => setActiveTab("quiz")}
          >
            Quizzes
          </Button>
          <Button 
            variant={activeTab === "profile" ? "default" : "outline"} 
            onClick={() => setActiveTab("profile")}
          >
            My Profile
          </Button>
          <Button 
            variant={activeTab === "resume" ? "default" : "outline"} 
            onClick={() => setActiveTab("resume")}
          >
            <FileText className="mr-2 h-4 w-4" />
            My Resume
          </Button>
        </div>
      </div>

      {activeTab === "quiz" ? (
        <QuizSegments />
      ) : activeTab === "profile" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RiasecChart />
          <WorkValuesChart />
          
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>My Competencies and Preferences</CardTitle>
              <CardDescription>Based on your quiz responses</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
                </div>
              ) : (
                <>
                  {/* Display profile codes */}
                  <UserProfileDisplay riasecCode={riasecCode} workValueCode={workValueCode} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Strengths</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Analytical thinking and problem-solving</li>
                        <li>Creative approaches to challenges</li>
                        <li>Strong communication and interpersonal skills</li>
                        <li>Detail-oriented with good organizational abilities</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Work Environment Preferences</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Collaborative team settings</li>
                        <li>Opportunities for continuous learning</li>
                        <li>Balance between structure and innovation</li>
                        <li>Recognition for contributions and achievements</li>
                      </ul>
                    </div>
                  </div>
                  <Separator className="my-6" />
                  
                  {/* Recommended Majors Section */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Recommended Majors</h3>
                    <p className="mb-4">Based on your RIASEC code ({riasecCode}) and Work Values code ({workValueCode}):</p>
                    
                    {/* Exact Matches */}
                    {recommendedMajors.exactMatches.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-md mb-2 flex items-center">
                          <Badge className="mr-2 bg-green-600">Exact Match</Badge>
                          Best match for your profile
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {recommendedMajors.exactMatches.map((major, index) => (
                            <div 
                              key={`exact-${index}`} 
                              className={`p-3 rounded-md ${isCurrentlyDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                            >
                              <p className="font-medium">{formatMajorName(major)}</p>
                              <p className="text-xs opacity-70">{getUniversityFromMajor(major) || 'University not specified'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Permutation Matches */}
                    {recommendedMajors.permutationMatches.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-md mb-2 flex items-center">
                          <Badge className="mr-2 bg-blue-600">Similar Match</Badge>
                          Similar codes with different priority
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {recommendedMajors.permutationMatches.map((major, index) => (
                            <div 
                              key={`perm-${index}`} 
                              className={`p-3 rounded-md ${isCurrentlyDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                            >
                              <p className="font-medium">{formatMajorName(major)}</p>
                              <p className="text-xs opacity-70">{getUniversityFromMajor(major) || 'University not specified'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* RIASEC Matches */}
                    {recommendedMajors.riasecMatches.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-md mb-2 flex items-center">
                          <Badge className="mr-2 bg-purple-600">RIASEC Match</Badge>
                          Matches based on your personality type
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {recommendedMajors.riasecMatches.map((major, index) => (
                            <div 
                              key={`riasec-${index}`} 
                              className={`p-3 rounded-md ${isCurrentlyDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                            >
                              <p className="font-medium">{formatMajorName(major)}</p>
                              <p className="text-xs opacity-70">{getUniversityFromMajor(major) || 'University not specified'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Work Value Matches */}
                    {recommendedMajors.workValueMatches.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-md mb-2 flex items-center">
                          <Badge className="mr-2 bg-amber-600">Work Values Match</Badge>
                          Matches based on your work preferences
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {recommendedMajors.workValueMatches.map((major, index) => (
                            <div 
                              key={`wv-${index}`} 
                              className={`p-3 rounded-md ${isCurrentlyDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                            >
                              <p className="font-medium">{formatMajorName(major)}</p>
                              <p className="text-xs opacity-70">{getUniversityFromMajor(major) || 'University not specified'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* No matches found */}
                    {recommendedMajors.exactMatches.length === 0 && 
                     recommendedMajors.permutationMatches.length === 0 &&
                     recommendedMajors.riasecMatches.length === 0 &&
                     recommendedMajors.workValueMatches.length === 0 && (
                      <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-center">
                        <p>No major recommendations found for your profile. Please complete all quizzes or contact support.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900">
                    <h3 className="text-lg font-semibold mb-2">Open-ended Questions</h3>
                    <p className="mb-4">
                      Take our specialized quiz to answer questions about specific majors based on your RIASEC and Work Values profile.
                    </p>
                    <Button onClick={handleOpenEndedQuiz}>Take Open-ended Quiz</Button>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" onClick={() => setActiveTab("quiz")}>Take More Quizzes</Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <MyResume />
      )}
    </div>
  );
};
