import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getMatchingMajors, mapRiasecToCode, mapWorkValueToCode, formCode } from '@/utils/recommendation';
import { formatMajorForFile } from '@/components/sections/majors/MajorUtils';

interface QuizQuestion {
  major: string;
  question: {
    id: string;
    category: string;
    criterion: string;
    question: string;
  };
}

const OpenEndedQuiz = () => {
  const navigate = useNavigate();
  const { isCurrentlyDark } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  
  // Profile data
  const [riasecProfile, setRiasecProfile] = useState<Array<{ component: string; average: number; score: number }>>([]);
  const [workValueProfile, setWorkValueProfile] = useState<Array<{ component: string; average: number; score: number }>>([]);
  
  // Debug state
  const [debugInfo, setDebugInfo] = useState<{
    completedQuizzes: string[];
    authChecked: boolean;
    profilesLoaded: boolean;
    prerequisitesChecked: boolean;
    prerequisitesMet: boolean;
    error?: string;
  }>({
    completedQuizzes: [],
    authChecked: false,
    profilesLoaded: false,
    prerequisitesChecked: false,
    prerequisitesMet: false,
  });
  
  // Load user data and prepare quiz
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      setLoading(true);
      
      try {
        // Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id || null;
        setUserId(currentUserId);
        
        console.log("Authentication check:", { currentUserId });
        setDebugInfo(prev => ({ ...prev, authChecked: true }));
        
        if (!currentUserId) {
          toast({
            title: "Not Logged In",
            description: "Please log in to take this quiz and save your progress.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }
        
        // Load user profiles for RIASEC and Work Values
        await loadUserProfiles(currentUserId);
        setDebugInfo(prev => ({ ...prev, profilesLoaded: true }));
        
        // Check if prerequisites are completed
        console.log("Checking prerequisites for user:", currentUserId);
        
        // First, try to get completions from local storage as fallback
        let localCompletions: string[] = [];
        try {
          const storedCompletions = localStorage.getItem('completed_quiz_segments');
          if (storedCompletions) {
            localCompletions = JSON.parse(storedCompletions);
            console.log("Local storage completions:", localCompletions);
          }
        } catch (err) {
          console.error("Error parsing local storage completions:", err);
        }
        
        // Then try to get completions from the database
        const { data: completions, error } = await supabase
          .from('quiz_completion')
          .select('quiz_type')
          .eq('user_id', currentUserId);
          
        if (error) {
          console.error("Error fetching quiz completions:", error);
          setDebugInfo(prev => ({ 
            ...prev, 
            prerequisitesChecked: true,
            error: `Database error: ${error.message}`
          }));
          
          // If there's an error, use local storage as fallback if available
          if (localCompletions.length > 0) {
            validateAndContinue(localCompletions);
          } else {
            toast({
              title: "Error",
              description: "Could not verify your quiz history. Please try again.",
              variant: "destructive"
            });
            navigate('/');
          }
          return;
        }
        
        if (completions) {
          const completedTypes = completions.map(c => c.quiz_type);
          console.log("Database completions:", completedTypes);
          
          setDebugInfo(prev => ({ 
            ...prev, 
            prerequisitesChecked: true,
            completedQuizzes: completedTypes 
          }));
          
          // If we have completions from both sources, merge them to be safe
          const allCompletions = [...new Set([...completedTypes, ...localCompletions])];
          validateAndContinue(allCompletions);
        } else {
          console.log("No completions found in database, falling back to local storage");
          if (localCompletions.length > 0) {
            validateAndContinue(localCompletions);
          } else {
            handlePrerequisitesNotMet();
          }
        }
      } catch (err) {
        console.error("Error in checkAuthAndLoadData:", err);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again later.",
          variant: "destructive"
        });
        navigate('/');
      }
    };
    
    const validateAndContinue = (completedTypes: string[]) => {
      // Normalize quiz types to handle potential casing/spacing issues
      const normalizeQuizType = (type: string) => type.toLowerCase().trim();
      
      const normalizedCompletedTypes = completedTypes.map(normalizeQuizType);
      
      const requiredQuizzes = ["interest-part 1", "interest-part 2", "competence", "work-values"];
      const normalizedRequiredQuizzes = requiredQuizzes.map(normalizeQuizType);
      
      console.log("Normalized completed types:", normalizedCompletedTypes);
      console.log("Normalized required quizzes:", normalizedRequiredQuizzes);
      
      // Check if all required quizzes are completed using normalized values
      const allCompleted = normalizedRequiredQuizzes.every(quiz => 
        normalizedCompletedTypes.some(completed => completed === quiz)
      );
      
      console.log("All prerequisites met:", allCompleted);
      setDebugInfo(prev => ({ 
        ...prev, 
        prerequisitesMet: allCompleted 
      }));
      
      if (allCompleted) {
        // All requirements met, prepare the quiz
        prepareQuizQuestions();
      } else {
        handlePrerequisitesNotMet();
      }
    };
    
    const handlePrerequisitesNotMet = () => {
      // Get the list of missing quizzes for better error messaging
      const requiredQuizzes = ["interest-part 1", "interest-part 2", "competence", "work-values"];
      const completedTypes = debugInfo.completedQuizzes;
      
      const missingQuizzes = requiredQuizzes.filter(quiz => 
        !completedTypes.some(completed => completed.toLowerCase().trim() === quiz.toLowerCase().trim())
      );
      
      console.log("Missing quizzes:", missingQuizzes);
      
      // Provide specific error message about missing quizzes
      const missingQuizzesText = missingQuizzes.length > 0 
        ? `Missing quizzes: ${missingQuizzes.join(", ")}` 
        : "Some required quizzes are not completed";
      
      toast({
        title: "Prerequisites Not Met",
        description: `Please complete all required quizzes before taking the open-ended quiz. ${missingQuizzesText}`,
        variant: "destructive"
      });
      
      navigate('/');
    };
    
    checkAuthAndLoadData();
  }, []);
  
  // Load user profiles
  const loadUserProfiles = async (userId: string) => {
    try {
      console.log("Loading user profiles for", userId);
      
      // Fetch RIASEC profile
      const { data: riasecData, error: riasecError } = await supabase
        .from('user_responses')
        .select('component, score')
        .eq('user_id', userId)
        .eq('quiz_type', 'riasec');
      
      if (riasecError) {
        console.error('Error fetching RIASEC profile:', riasecError);
      } else if (riasecData && riasecData.length > 0) {
        const transformedData = riasecData
          .map(item => ({
            component: item.component,
            score: item.score,
            average: item.score
          }))
          .sort((a, b) => b.score - a.score);
          
        setRiasecProfile(transformedData);
      }
      
      // Fetch Work Value profile
      const { data: workValueData, error: workValueError } = await supabase
        .from('user_responses')
        .select('component, score')
        .eq('user_id', userId)
        .eq('quiz_type', 'work_value');
      
      if (workValueError) {
        console.error('Error fetching Work Value profile:', workValueError);
      } else if (workValueData && workValueData.length > 0) {
        const transformedData = workValueData
          .map(item => ({
            component: item.component,
            score: item.score,
            average: item.score
          }))
          .sort((a, b) => b.score - a.score);
          
        setWorkValueProfile(transformedData);
      }
      
      // Also try to fetch from different quiz types as fallback
      if ((!riasecData || riasecData.length === 0)) {
        const { data: fallbackRiasecData, error: fallbackError } = await supabase
          .from('user_responses')
          .select('component, score')
          .eq('user_id', userId)
          .in('quiz_type', ['interest-part 1', 'interest-part 2', 'competence'])
          .not('component', 'is', null);
          
        if (!fallbackError && fallbackRiasecData && fallbackRiasecData.length > 0) {
          console.log("Using fallback RIASEC data:", fallbackRiasecData);
          
          // Group responses by component and sum scores
          const componentScores: Record<string, number> = {};
          fallbackRiasecData.forEach(response => {
            if (response.component) {
              componentScores[response.component] = (componentScores[response.component] || 0) + (response.score || 0);
            }
          });
          
          // Convert to array and sort by score
          const sortedComponents = Object.entries(componentScores)
            .map(([component, score]) => ({ component, score, average: score }))
            .sort((a, b) => b.score - a.score);
            
          setRiasecProfile(sortedComponents);
        }
      }
      
      if ((!workValueData || workValueData.length === 0)) {
        const { data: fallbackWorkValueData, error: fallbackError } = await supabase
          .from('user_responses')
          .select('component, score')
          .eq('user_id', userId)
          .eq('quiz_type', 'work-values')
          .not('component', 'is', null);
          
        if (!fallbackError && fallbackWorkValueData && fallbackWorkValueData.length > 0) {
          console.log("Using fallback Work Value data:", fallbackWorkValueData);
          
          // Group responses by component and sum scores
          const componentScores: Record<string, number> = {};
          fallbackWorkValueData.forEach(response => {
            if (response.component) {
              componentScores[response.component] = (componentScores[response.component] || 0) + (response.score || 0);
            }
          });
          
          // Convert to array and sort by score
          const sortedComponents = Object.entries(componentScores)
            .map(([component, score]) => ({ component, score, average: score }))
            .sort((a, b) => b.score - a.score);
            
          setWorkValueProfile(sortedComponents);
        }
      }
      
    } catch (error) {
      console.error('Error loading user profiles:', error);
    }
  };
  
  // Prepare quiz questions based on recommended majors
  const prepareQuizQuestions = async () => {
    try {
      // Get top RIASEC components
      const topRiasec = riasecProfile.slice(0, 3);
      
      // Get top Work Values components
      const topWorkValues = workValueProfile.slice(0, 3);
      
      // Log the data for debugging
      console.log("Top RIASEC components for quiz generation:", topRiasec);
      console.log("Top Work Values components for quiz generation:", topWorkValues);
      
      // If profiles are empty, use hardcoded default values for testing
      const useTopRiasec = topRiasec.length > 0 ? topRiasec : [
        { component: "R", score: 5, average: 5 },
        { component: "S", score: 4, average: 4 },
        { component: "A", score: 3, average: 3 }
      ];
      
      const useTopWorkValues = topWorkValues.length > 0 ? topWorkValues : [
        { component: "Recognition", score: 5, average: 5 },
        { component: "Achievement", score: 4, average: 4 },
        { component: "Independence", score: 3, average: 3 }
      ];
      
      // Generate codes for recommendation
      const generatedRiasecCode = formCode(useTopRiasec, mapRiasecToCode) || "RSI";
      const generatedWorkValueCode = formCode(useTopWorkValues, mapWorkValueToCode) || "ARS";
      
      console.log("Generated codes for quiz:", {
        riasec: generatedRiasecCode,
        workValues: generatedWorkValueCode
      });
      
      // Get recommended majors based on profile codes
      const majorRecommendations = await getMatchingMajors(generatedRiasecCode, generatedWorkValueCode);
      
      // Combine all recommended majors in priority order
      const recommendedMajors = [
        ...majorRecommendations.exactMatches,
        ...majorRecommendations.riasecMatches,
        ...majorRecommendations.workValueMatches
      ];
      
      // Remove duplicates
      const uniqueRecommendedMajors = [...new Set(recommendedMajors)];
      
      console.log("Recommended majors for quiz questions:", uniqueRecommendedMajors);
      
      // If we have recommended majors, use them for questions
      if (uniqueRecommendedMajors.length > 0) {
        // Select up to 5 majors
        const selectedMajors = uniqueRecommendedMajors.slice(0, 5);
        
        console.log("Selected majors for quiz:", selectedMajors);
        
        // For each selected major, load and select questions
        const quizQuestions: QuizQuestion[] = [];
        
        for (const major of selectedMajors) {
          try {
            // Format major for file lookup
            const [majorName, school] = major.split(' at ');
            const formattedMajor = formatMajorForFile(majorName, school || '');
            
            // Fetch questions from the JSON file
            const response = await fetch(`/quiz_refer/Open_ended_quiz_questions/${formattedMajor}.json`);
            if (!response.ok) {
              console.error(`Failed to load questions for ${major}`);
              continue;
            }
            
            const allQuestions = await response.json();
            console.log(`Found ${allQuestions.length} questions for ${major}`);
            
            // Categorize questions by criterion
            const interestQuestions = allQuestions.filter(q => 
              q.criterion.toLowerCase().includes('interest')
            );
            const skillQuestions = allQuestions.filter(q => 
              q.criterion.toLowerCase().includes('skill')
            );
            const experienceQuestions = allQuestions.filter(q => 
              q.criterion.toLowerCase().includes('experience') || 
              q.criterion.toLowerCase().includes('background')
            );
            
            console.log(`Questions by category for ${major}:`, {
              interests: interestQuestions.length,
              skills: skillQuestions.length,
              experience: experienceQuestions.length
            });
            
            // Select one random question from each category if available
            const categories = [
              { name: 'interests', questions: interestQuestions },
              { name: 'skills', questions: skillQuestions },
              { name: 'experience', questions: experienceQuestions }
            ];
            
            for (const category of categories) {
              if (category.questions.length > 0) {
                const randomIndex = Math.floor(Math.random() * category.questions.length);
                const question = category.questions[randomIndex];
                
                quizQuestions.push({
                  major,
                  question: {
                    ...question,
                    category: category.name
                  }
                });
              }
            }
          } catch (error) {
            console.error(`Error loading questions for ${major}:`, error);
            // Continue to next major
          }
        }
        
        // Shuffle the questions for variety
        const shuffledQuestions = quizQuestions.sort(() => Math.random() - 0.5);
        console.log(`Final quiz generated with ${shuffledQuestions.length} questions from recommended majors`);
        setQuestions(shuffledQuestions);
        
        if (shuffledQuestions.length === 0) {
          console.log("No questions found for recommended majors, falling back to random selection");
          // Fall back to existing random major selection
          loadRandomMajorQuestions();
        }
      } else {
        console.log("No recommended majors found, falling back to random selection");
        // Fall back to existing random major selection
        loadRandomMajorQuestions();
      }
      
    } catch (error) {
      console.error('Error preparing quiz questions based on profile:', error);
      // Fall back to existing random major selection
      loadRandomMajorQuestions();
    } finally {
      setLoading(false);
    }
  };
  
  // Fallback function to load questions from random majors
  const loadRandomMajorQuestions = async () => {
    try {
      // Fetch all majors from the standardized weights files
      const [ntuMajors, nusMajors, smuMajors] = await Promise.all([
        fetch('/school-data/Standardized weights/standardized_ntu_majors.json').then(r => r.json()),
        fetch('/school-data/Standardized weights/standardized_nus_majors.json').then(r => r.json()),
        fetch('/school-data/Standardized weights/standardized_smu_majors.json').then(r => r.json())
      ]);
      
      // Get unique majors from all schools
      const allPrograms = [
        ...ntuMajors.programs, 
        ...nusMajors.programs,
        ...smuMajors.programs
      ];
      
      console.log(`Found ${allPrograms.length} total programs across all schools`);
      
      // Randomly select majors for the quiz
      const selectedMajors = [];
      const majorCount = Math.min(5, allPrograms.length);
      
      for (let i = 0; i < majorCount; i++) {
        const randomIndex = Math.floor(Math.random() * allPrograms.length);
        selectedMajors.push(allPrograms[randomIndex].major);
        allPrograms.splice(randomIndex, 1);
      }
      
      console.log("Selected random majors for quiz:", selectedMajors);
      
      // For each selected major, load and select questions
      const quizQuestions: QuizQuestion[] = [];
      
      for (const major of selectedMajors) {
        try {
          // Try to formalize the filename format
          const formattedMajor = major.replace(/ /g, '_').replace(/[\/&,]/g, '_');
          const schools = ['NTU', 'NUS', 'SMU'];
          
          // Try each school suffix until we find one that works
          let foundQuestions = false;
          for (const school of schools) {
            if (foundQuestions) continue;
            
            try {
              const response = await fetch(`/quiz_refer/Open_ended_quiz_questions/${formattedMajor}_${school}.json`);
              
              if (response.ok) {
                const allQuestions = await response.json();
                console.log(`Found ${allQuestions.length} questions for ${major} at ${school}`);
                
                // Categorize questions
                const interestQuestions = allQuestions.filter(q => 
                  q.criterion.toLowerCase().includes('interest')
                );
                const skillQuestions = allQuestions.filter(q => 
                  q.criterion.toLowerCase().includes('skill')
                );
                const experienceQuestions = allQuestions.filter(q => 
                  q.criterion.toLowerCase().includes('experience') || 
                  q.criterion.toLowerCase().includes('background')
                );
                
                console.log(`Questions by category for ${major} at ${school}:`, {
                  interests: interestQuestions.length,
                  skills: skillQuestions.length,
                  experience: experienceQuestions.length
                });
                
                // Select one random question from each category if available
                const categories = [
                  { name: 'interests', questions: interestQuestions },
                  { name: 'skills', questions: skillQuestions },
                  { name: 'experience', questions: experienceQuestions }
                ];
                
                for (const category of categories) {
                  if (category.questions.length > 0) {
                    const randomIndex = Math.floor(Math.random() * category.questions.length);
                    const question = category.questions[randomIndex];
                    
                    quizQuestions.push({
                      major: `${major} at ${school}`,
                      question: {
                        ...question,
                        category: category.name
                      }
                    });
                  }
                }
                
                foundQuestions = true;
                break;
              }
            } catch (error) {
              console.error(`Error loading questions for ${major} at ${school}:`, error);
              // Continue to next school
            }
          }
          
          if (!foundQuestions) {
            console.log(`No questions found for ${major} at any school`);
          }
        } catch (error) {
          console.error(`Could not load questions for ${major}:`, error);
        }
      }
      
      // Shuffle the questions for variety
      const shuffledQuestions = quizQuestions.sort(() => Math.random() - 0.5);
      console.log(`Final quiz generated with ${shuffledQuestions.length} questions`);
      setQuestions(shuffledQuestions);
      
      if (shuffledQuestions.length === 0) {
        toast({
          title: "No Questions Available",
          description: "Could not load questions for any majors. Please try again later.",
          variant: "destructive"
        });
        navigate('/');
      }
      
    } catch (error) {
      console.error('Error loading random major questions:', error);
      toast({
        title: "Error",
        description: "Failed to prepare quiz questions. Please try again later.",
        variant: "destructive"
      });
      setLoading(false);
      navigate('/');
    }
  };
  
  // Handle response changes
  const handleResponseChange = (value: string) => {
    if (currentQuestionIndex >= questions.length) return;
    
    const questionId = questions[currentQuestionIndex].question.id;
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  // Navigate to next question
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  // Submit all responses
  const handleSubmit = async () => {
    if (!userId) {
      toast({
        title: "Not Logged In",
        description: "Please log in to save your responses.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if all questions have been answered
    const unansweredQuestions = questions.filter(q => 
      !responses[q.question.id] || responses[q.question.id].trim() === ''
    );
    
    if (unansweredQuestions.length > 0) {
      toast({
        title: "Incomplete",
        description: `Please answer all questions before submitting. You have ${unansweredQuestions.length} unanswered questions.`,
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    try {
      // Prepare responses for database
      const responsesToSubmit = Object.entries(responses).map(([questionId, response]) => ({
        user_id: userId,
        question_id: questionId,
        response: response,
        quiz_type: 'open-ended'
      }));
      
      // Upload responses to Supabase
      const { error } = await supabase
        .from('user_responses')
        .insert(responsesToSubmit);
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Update quiz completion status
      const { error: completionError } = await supabase
        .from('quiz_completion')
        .upsert({
          user_id: userId,
          quiz_type: 'open-ended'
        }, {
          onConflict: 'user_id, quiz_type'
        });
        
      if (completionError) {
        console.error('Error updating quiz completion:', completionError);
      }
      
      // Also update local storage for redundancy
      try {
        const storedCompletions = localStorage.getItem('completed_quiz_segments');
        const completions = storedCompletions ? JSON.parse(storedCompletions) : [];
        
        if (!completions.includes('open-ended')) {
          completions.push('open-ended');
          localStorage.setItem('completed_quiz_segments', JSON.stringify(completions));
        }
      } catch (error) {
        console.error("Error updating local storage:", error);
      }
      
      toast({
        title: "Success!",
        description: "Your responses have been submitted successfully.",
        variant: "default"
      });
      
      // Redirect to home page
      navigate('/');
    } catch (error) {
      console.error('Error submitting responses:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your responses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Calculate progress percentage
  const progress = questions.length > 0 
    ? Math.round(((currentQuestionIndex + 1) / questions.length) * 100) 
    : 0;
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Open-ended Quiz</h1>
        <div className="space-y-8">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-64 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        
        {/* Debug information panel */}
        {import.meta.env.DEV && (
          <div className="mt-8 p-4 border border-gray-300 rounded-md">
            <h3 className="font-semibold mb-2">Debug Information</h3>
            <pre className="text-xs overflow-auto bg-gray-100 dark:bg-gray-800 p-2 rounded">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }
  
  if (questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-6">Open-ended Quiz</h1>
        <Card className="p-8">
          <p className="mb-6">No questions are available at this time. Please try again later.</p>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </Card>
        
        {/* Debug information panel */}
        {import.meta.env.DEV && (
          <div className="mt-8 p-4 border border-gray-300 rounded-md">
            <h3 className="font-semibold mb-2">Debug Information</h3>
            <pre className="text-xs overflow-auto bg-gray-100 dark:bg-gray-800 p-2 rounded">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Open-ended Quiz</h1>
        <Button variant="outline" onClick={() => navigate('/')}>Exit Quiz</Button>
      </div>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm font-medium">{currentQuestionIndex + 1} of {questions.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <Card className={`p-6 transition-all duration-300 animate-fade-in ${isCurrentlyDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="mb-4">
          <Badge className="mb-2 capitalize">{currentQuestion.question.category || currentQuestion.question.criterion}</Badge>
          <h3 className="text-xl font-medium mb-1">Major: {currentQuestion.major}</h3>
          <p className="text-lg mb-6">{currentQuestion.question.question}</p>
          
          <Textarea
            className="min-h-[150px]"
            placeholder="Type your answer here..."
            value={responses[currentQuestion.question.id] || ''}
            onChange={(e) => handleResponseChange(e.target.value)}
          />
        </div>
        
        <div className="flex justify-between mt-6">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          
          {currentQuestionIndex < questions.length - 1 ? (
            <Button onClick={handleNext}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          )}
        </div>
      </Card>
      
      {/* Debug information panel (only visible in development) */}
      {import.meta.env.DEV && (
        <div className="mt-8 p-4 border border-gray-300 rounded-md">
          <h3 className="font-semibold mb-2">Debug Information</h3>
          <pre className="text-xs overflow-auto bg-gray-100 dark:bg-gray-800 p-2 rounded">
            {JSON.stringify({
              ...debugInfo,
              currentUserId: userId,
              profiles: {
                riasec: riasecProfile.length,
                workValues: workValueProfile.length
              },
              questionsLoaded: questions.length,
              currentQuestion: currentQuestionIndex + 1,
              answeredQuestions: Object.keys(responses).length
            }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default OpenEndedQuiz;
