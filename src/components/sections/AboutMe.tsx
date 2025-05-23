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
import { fetchModuleRecommendations, Module } from '@/utils/recommendation/moduleRecommendationUtils';
import { ModuleRatingCard } from '@/components/ModuleRatingCard';
import { useRecommendationContext } from '@/contexts/RecommendationContext';
import { useToast } from "@/hooks/use-toast";

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
  const [recommendedModules, setRecommendedModules] = useState<Module[]>([]);
  const [loadingModules, setLoadingModules] = useState<boolean>(false);
  const navigate = useNavigate();
  const { isCurrentlyDark } = useTheme();
  const { toast } = useToast();
  
  // Use the global recommendation context for state management
  const { 
    updateModuleRecommendations, 
    updateMajorRecommendations 
  } = useRecommendationContext();
  
  // Enhanced state for dynamic profile information
  const [profileInfo, setProfileInfo] = useState({
    strengths: [] as string[],
    workPreferences: [] as string[],
    likes: [] as string[],
    dislikes: [] as string[]
  });
  
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

        // Generate dynamic profile information based on RIASEC and Work Values
        const dynamicStrengths = generateStrengthsFromRIASEC(generatedRiasecCode);
        const dynamicWorkPreferences = generateWorkPreferencesFromWorkValues(generatedWorkValueCode);
        const dynamicLikes = generateLikesFromRIASEC(generatedRiasecCode);
        const dynamicDislikes = generateDislikesFromRIASEC(generatedRiasecCode);
        
        setProfileInfo({
          strengths: dynamicStrengths,
          workPreferences: dynamicWorkPreferences,
          likes: dynamicLikes,
          dislikes: dynamicDislikes
        });
        
        // NEW: Store profile data in database for global access
        const { data: upsertData, error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            riasec_code: generatedRiasecCode,
            work_value_code: generatedWorkValueCode,
            personality_traits: JSON.stringify(dynamicStrengths),
            work_environment_preferences: JSON.stringify(dynamicWorkPreferences),
            likes: JSON.stringify(dynamicLikes),
            dislikes: JSON.stringify(dynamicDislikes)
          }, { onConflict: 'id' })
          
        if (upsertError) {
          console.error("Error updating profile data:", upsertError);
          toast({
            title: "Profile Update Error",
            description: "There was an error saving your profile information.",
            variant: "destructive"
          });
        } else {
          console.log("Updated profile data in database:", upsertData);
        }
        
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
          
          // NEW: Store recommended major in database
          
          const { error: majorError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              recommended_major: [
                majorRecommendations.exactMatches,
                majorRecommendations.riasecMatches,
                majorRecommendations.workValueMatches,
                majorRecommendations.permutationMatches
              ].join(', ')
            }, { onConflict: 'id' })
            
          if (majorError) {
            console.error("Error storing recommended majors:", majorError);
          } else {
            console.log("Stored recommended majors in database");
          }
          
          // IMPORTANT: Update the global context with major recommendations
          updateMajorRecommendations(majorRecommendations);
          
          // Fetch module recommendations based on the recommended majors
          setLoadingModules(true);
          try {
            const modules = await fetchModuleRecommendations(majorRecommendations);
            console.log("Recommended modules:", modules);
            setRecommendedModules(modules);
            
            // Update the global module recommendations with the fetched modules
            updateModuleRecommendations(modules.map(module => ({
              id: getModuleId(module.modulecode),
              university: module.institution,
              course_code: module.modulecode,
              title: module.title,
              description: module.description || "No description available.",
              aus_cus: 4,
              semester: "1"
            })));
            
            console.log("Updated global module recommendations in context");
            
          } catch (error) {
            console.error("Error fetching module recommendations:", error);
          } finally {
            setLoadingModules(false);
          }
        }
      } catch (error) {
        console.error("Error loading user profiles:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadUserProfiles();
  }, [updateModuleRecommendations, updateMajorRecommendations, toast]);

  // Helper function to generate consistent module IDs
  const getModuleId = (code: string) => {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  // ... keep existing code (generateStrengthsFromRIASEC, generateLikesFromRIASEC, generateDislikesFromRIASEC, generateWorkPreferencesFromWorkValues functions)

  const generateStrengthsFromRIASEC = (code: string): string[] => {
    const traits: Record<string, string[]> = {
      'R': ['Independent and Reliable', 'Practical and Physically Adept', 'Straightforward and Persistent'],
      'I': ['Curious and Analytical', 'Logical and Observant', 'Introspective', 'Critical thinker'],
      'A': ['Imaginative and Expressive', 'Intuitive and Original', 'Emotional and Open-minded', 'Open-minded'],
      'S': ['Empathetic and Friendly', 'Nurturing and Patient', 'Supportive and Cooperative'],
      'E': ['Charismatic and Ambitious', 'Optimistic and Energetic', 'Assertive and Goal-oriented'],
      'C': ['Organized and Methodical', 'Detail-oriented and Conscientious', 'Disciplined']
    };

    // Get the top 2-3 letters from the code
    const topLetters = code.slice(0, Math.min(3, code.length));
    
    // Collect traits for each letter in the code
    const result: string[] = [];
    for (const letter of topLetters) {
      if (traits[letter]) {
        // Add 2 random traits from each letter category
        const categoryTraits = traits[letter];
        const selectedTraits: string[] = [];
        const indices = [...Array(categoryTraits.length).keys()]; // Array of indices [0, 1, 2, ...]
        for (let i = 0; i < Math.min(2, categoryTraits.length); i++) {
          if (indices.length === 0) break; // Avoid errors if fewer than 2 traits
          const randomIndex = Math.floor(Math.random() * indices.length);
          const traitIndex = indices.splice(randomIndex, 1)[0]; // Remove and get random index
          selectedTraits.push(categoryTraits[traitIndex]);
        }
        result.push(...selectedTraits);
      }
    }
    return result.slice(0, 6); // Limit to 6 traits total
  };
  
  // New function to generate likes based on RIASEC code
  const generateLikesFromRIASEC = (code: string): string[] => {
    const likes: Record<string, string[]> = {
      'R': ['Working with tools, machines, or materials', 'Building or fixing things', 'Outdoor activities', 'Tasks with clear, tangible outcomes'],
      'I': ['Researching', 'Experimenting', 'Analyzing data', 'Solving complex problems', 'Learning new concepts'],
      'A': ['Creating art, writing, music, or designs', 'Experimenting with aesthetics', 'Expressing individuality'],
      'S': ['Helping, teaching, or counseling others', 'Collaborating in teams', 'Building relationships', 'Making a positive impact'],
      'E': ['Leading teams', 'Persuading others', 'Negotiating', 'Starting businesses', 'Taking risks'],
      'C': ['Managing data', 'Creating schedules', 'Maintaining records', 'Following clear procedures', 'Structured environments']
    };

    // Get top 3 letters from the code
    const topLetters = code.slice(0, Math.min(3, code.length));
    
    // Collect likes for each letter
    const result: string[] = [];
    for (const letter of topLetters) {
      if (likes[letter]) {
        // Add 1-2 likes from each category
        const categoryLikes = likes[letter];
        const randomIndex = Math.floor(Math.random() * categoryLikes.length);
        result.push(categoryLikes[randomIndex]);
        
        // Add a second like if available
        if (categoryLikes.length > 1) {
          let secondIndex = (randomIndex + 1) % categoryLikes.length;
          result.push(categoryLikes[secondIndex]);
        }
      }
    }
    
    return result.slice(0, 4); // Limit to 4 total likes
  };
  
  // New function to generate dislikes based on RIASEC code
  const generateDislikesFromRIASEC = (code: string): string[] => {
    const dislikes: Record<string, string[]> = {
      'R': ['Abstract theorizing', 'Ambiguous tasks', 'Highly social or desk-bound work'],
      'I': ['Routine tasks', 'Overly social environments', 'Lack of intellectual challenge'],
      'A': ['Rigid structures', 'Repetitive tasks', 'Conforming to strict rules'],
      'S': ['Isolated work', 'Competitive environments', 'Tasks without human connection'],
      'E': ['Lack of control', 'Mundane tasks', 'Environments without opportunities for advancement'],
      'C': ['Chaos', 'Ambiguity', 'Highly creative or unpredictable tasks']
    };

    // Get top 3 letters from the code
    const topLetters = code.slice(0, Math.min(3, code.length));
    
    // Collect dislikes for each letter
    const result: string[] = [];
    for (const letter of topLetters) {
      if (dislikes[letter]) {
        // Add 1 dislike from each category
        const categoryDislikes = dislikes[letter];
        const randomDislike = categoryDislikes[Math.floor(Math.random() * categoryDislikes.length)];
        result.push(randomDislike);
      }
    }
    
    return result.slice(0, 3); // Limit to 3 total dislikes
  };

  // Updated function to generate work preferences based on Work Values code
const generateWorkPreferencesFromWorkValues = (code: string): string[] => {
  const preferences: Record<string, string[]> = {
    'A': [
      'Challenging Tasks and Clear Measurable Goals',
      'Opportunities for Advancement and Regular Performance Feedback',
      'Culture Rewarding Excellence'
    ],
    'R': [
      'Collaborative Team-Oriented Settings and Supportive Inclusive Culture',
      'Trust and Mutual Respect and Frequent Colleague Interaction'
    ],
    'I': [
      'Autonomous and Flexible Roles and Minimal Supervision',
      'Independent Decision-Making and Creative Approaches to Tasks'
    ],
    'Rc': [
      'Public Acknowledgment of Contributions and Clear Promotion Pathways',
      'Recognition through Awards and Career Advancement Opportunities'
    ],
    'W': [
      'Safe Well-Equipped Workplace and Fair Compensation',
      'Reasonable Hours and Job Security',
      'Work-Life Balance'
    ],
    'S': [
      'Supportive Leadership and Clear Guidance',
      'Mentorship Opportunities and Accessible Resources',
      'Encouraging Atmosphere'
    ]
  };

  const result: string[] = [];
  const upperCode = code.toUpperCase();
  const uniqueLetters = [...new Set(upperCode.split(''))];

  // Step 1: If 4-letter code with both R and C, include Rc first
  if (upperCode.length === 4 && uniqueLetters.includes('R') && uniqueLetters.includes('C')) {
    result.push(...preferences['Rc'].slice(0, 2));
  }

  // Step 2: Go through the top 3 letters in the original code (in order) and pull prefs
  for (const letter of upperCode.slice(0, 3)) {
    const key = letter;
    if (preferences[key]) {
      for (const pref of preferences[key]) {
        if (result.length >= 4) break;
        if (!result.includes(pref)) {
          result.push(pref);
        }
      }
    }
    if (result.length >= 4) break;
  }

  return result.slice(0, 4); // Return up to 4 preferences
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
                    
                    {/* New Likes section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Likes</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {profileInfo.likes.map((like, index) => <li key={`like-${index}`}>{like}</li>)}
                      </ul>
                    </div>
                    
                    {/* New Dislikes section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Dislikes</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {profileInfo.dislikes.map((dislike, index) => <li key={`dislike-${index}`}>{dislike}</li>)}
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
                  
                  {/* New Module Recommendations Section */}
                  {(recommendedModules.length > 0 || loadingModules) && (
                    <div className="mt-8 mb-6">
                      <h3 className="text-lg font-semibold mb-3">Recommended Courses</h3>
                      <p className="mb-4">Based on your recommended majors, these courses might interest you:</p>
                      
                      {loadingModules ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
                        </div>
                      ) : recommendedModules.length > 0 ? (
                        <div className="space-y-6">
                          {recommendedModules.map((module, index) => (
                            <div key={`module-${index}`} className={`p-4 rounded-lg ${isCurrentlyDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <span className="font-medium text-sm text-blue-500">{module.institution}</span>
                                  <h4 className="text-lg font-bold">{module.modulecode}: {module.title}</h4>
                                </div>
                                <Badge className="ml-2">{module.institution}</Badge>
                              </div>
                              <p className="text-sm mt-2">
                                {module.description.length > 200
                                  ? `${module.description.substring(0, 200)}...`
                                  : module.description}
                              </p>
                              {module.description.length > 200 && (
                                <Button variant="link" className="p-0 h-auto text-sm mt-1" onClick={() => {
                                  // You could implement a modal or expand functionality here
                                  // For now we'll just show an alert with the full description
                                  alert(module.description);
                                }}>
                                  Read more
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center py-4 italic">No course recommendations found for your profile.</p>
                      )}
                    </div>
                  )}
                  
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
