import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  ArrowRight, 
  SkipForward,
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Bug
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRecommendationContext } from '@/contexts/RecommendationContext';

interface QuizQuestion {
  major: string;
  question: {
    id: string;
    category: string;
    criterion: string;
    question: string;
  };
  uniqueId?: string; // Add uniqueId field
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
  const [visibleCount, setVisibleCount] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const questionsRef = useRef<HTMLDivElement>(null);
  const currentQuestionRef = useRef<HTMLDivElement>(null);
  
  // Add cached responses state management
  const [responses, setResponses] = useState<Record<string, { response: string; skipped: boolean }>>({});
  
  // Load cached responses on component mount
  useEffect(() => {
    try {
      const cachedResponses = localStorage.getItem('openEndedQuizResponses');
      if (cachedResponses) {
        const parsedResponses = JSON.parse(cachedResponses);
        console.log("Loaded cached responses from localStorage:", parsedResponses);
        setResponses(parsedResponses);
      }
    } catch (error) {
      console.error("Error loading cached responses:", error);
    }
  }, []);
  
  // Cache responses whenever they change
  useEffect(() => {
    if (Object.keys(responses).length > 0) {
      try {
        localStorage.setItem('openEndedQuizResponses', JSON.stringify(responses));
        console.log("Cached responses to localStorage:", responses);
      } catch (error) {
        console.error("Error caching responses:", error);
      }
    }
  }, [responses]);
  
  // Get recommended majors directly from context
  const { majorRecommendations } = useRecommendationContext();
  
  // Debug state
  const [debugInfo, setDebugInfo] = useState<{
    completedQuizzes: string[];
    authChecked: boolean;
    profilesLoaded: boolean;
    prerequisitesChecked: boolean;
    prerequisitesMet: boolean;
    majorsList: string[];
    error?: string;
  }>({
    completedQuizzes: [],
    authChecked: false,
    profilesLoaded: false,
    prerequisitesChecked: false,
    prerequisitesMet: false,
    majorsList: [],
  });
  
  // Generate a unique ID for a question
  const generateUniqueId = (question: QuizQuestion, index: number): string => {
    return `${question.major.replace(/ /g, '_')}_${question.question.id}_${index}`;
  };
  
  // Load user data and prepare quiz - simplified to focus on using global majors
  useEffect(() => {
    const loadUserAndPrepareQuiz = async () => {
      setLoading(true);
      
      try {
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id || null;
        setUserId(currentUserId);
        
        console.log("Authentication check:", { currentUserId });
        
        if (!currentUserId) {
          toast({
            title: "Not Logged In",
            description: "Please log in to take this quiz and save your progress.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }
        
        // Check if prerequisites are completed (quizzes)
        const { data: completions, error } = await supabase
          .from('quiz_completion')
          .select('quiz_type')
          .eq('user_id', currentUserId);
          
        if (error) {
          console.error("Error fetching quiz completions:", error);
          toast({
            title: "Error",
            description: "Could not verify your quiz history. Please try again.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }
        
        // Get completed quiz types
        const completedTypes = completions ? completions.map(c => c.quiz_type) : [];
        setDebugInfo(prev => ({
          ...prev,
          completedQuizzes: completedTypes,
          authChecked: true,
          profilesLoaded: true,
          prerequisitesChecked: true
        }));
        
        // Check if required quizzes are completed
        const requiredQuizzes = ["interest-part 1", "interest-part 2", "competence", "work-values"];
        const allCompleted = requiredQuizzes.every(quiz => 
          completedTypes.some(completed => 
            completed.toLowerCase().trim() === quiz.toLowerCase().trim()
          )
        );
        
        setDebugInfo(prev => ({
          ...prev,
          prerequisitesMet: allCompleted
        }));
        
        if (!allCompleted) {
          const missingQuizzes = requiredQuizzes.filter(quiz => 
            !completedTypes.some(completed => 
              completed.toLowerCase().trim() === quiz.toLowerCase().trim()
            )
          );
          
          toast({
            title: "Prerequisites Not Met",
            description: `Please complete all required quizzes first. Missing: ${missingQuizzes.join(', ')}`,
            variant: "destructive"
          });
          navigate('/');
          return;
        }
        
        // We passed all checks, now use the global major recommendations
        console.log("Using global major recommendations:", majorRecommendations);
        
        // Extract all recommended majors from context
        if (majorRecommendations) {
          const allRecommendedMajors = [
            ...(majorRecommendations.exactMatches || []),
            ...(majorRecommendations.permutationMatches || []),
            ...(majorRecommendations.riasecMatches || []),
            ...(majorRecommendations.workValueMatches || [])
          ];
          
          // Remove duplicates
          const uniqueMajors = [...new Set(allRecommendedMajors)];
          
          // Debug log
          console.log("Extracted majors from context:", uniqueMajors);
          
          // Update debug info
          setDebugInfo(prev => ({
            ...prev,
            majorsList: uniqueMajors
          }));
          
          if (uniqueMajors.length > 0) {
            // We have majors, prepare quiz questions
            await prepareQuizQuestions(uniqueMajors);
          } else {
            console.log("No majors found in context");
            toast({
              title: "No Majors Found",
              description: "We couldn't find any recommended majors. Please complete your profile first.",
              variant: "destructive"
            });
            navigate('/');
          }
        } else {
          console.log("Major recommendations context is null or undefined");
          toast({
            title: "No Recommendations",
            description: "We couldn't find your major recommendations. Please complete your profile first.",
            variant: "destructive"
          });
          navigate('/');
        }
      } catch (err) {
        console.error("Error loading quiz data:", err);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again later.",
          variant: "destructive"
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserAndPrepareQuiz();
  }, [navigate, toast, majorRecommendations]);
  
  // Helper function to format major name for file lookup
  const formatMajorForFile = (majorName: string, schoolName: string | undefined) => {
    const formattedMajor = majorName.replace(/ /g, '_').replace(/[\/&,]/g, '_');
    return schoolName ? `${formattedMajor}_${schoolName}` : formattedMajor;
  };
  
  // Function to prepare quiz questions from the list of majors
  const prepareQuizQuestions = async (majors: string[]) => {
    try {
      console.log("Preparing quiz questions for majors:", majors);
      
      // Limit to 5 majors for the quiz
      const selectedMajors = majors.slice(0, 5);
      const quizQuestions: QuizQuestion[] = [];
      
      // Load questions for each major
      for (const major of selectedMajors) {
        try {
          // Split major name and school
          const [majorName, school] = major.split(' at ');
          console.log(`Loading questions for ${majorName} at ${school || 'any school'}`);
          
          // Try to load questions with specific school or try all schools
          await loadQuestionsForMajor(majorName, school, quizQuestions);
        } catch (error) {
          console.error(`Error loading questions for ${major}:`, error);
        }
      }
      
      // Shuffle the questions
      const shuffledQuestions = quizQuestions.sort(() => Math.random() - 0.5);
      
      // Add unique IDs to each question
      const questionsWithIds = shuffledQuestions.map((question, index) => ({
        ...question,
        uniqueId: generateUniqueId(question, index)
      }));
      
      console.log(`Generated ${questionsWithIds.length} questions for the quiz`);
      
      if (questionsWithIds.length === 0) {
        toast({
          title: "No Questions Available",
          description: "We couldn't find any questions for your recommended majors.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }
      
      setQuestions(questionsWithIds);
    } catch (error) {
      console.error("Error preparing quiz questions:", error);
      toast({
        title: "Error",
        description: "Failed to prepare quiz questions. Please try again later.",
        variant: "destructive"
      });
    }
  };
  
  // Load questions for a specific major
  const loadQuestionsForMajor = async (
    majorName: string, 
    schoolName: string | undefined, 
    quizQuestions: QuizQuestion[]
  ) => {
    // Format the major name for file lookup
    const formattedMajor = formatMajorForFile(majorName, schoolName);
    
    // Determine which schools to try
    const schools = schoolName ? [schoolName] : ['NTU', 'NUS', 'SMU'];
    
    // Try each school
    for (const school of schools) {
      try {
        const formattedFileName = formatMajorForFile(majorName, school);
        console.log(`Trying to load questions for ${formattedFileName}.json`);
        
        const response = await fetch(`/quiz_refer/Open_ended_quiz_questions/${formattedFileName}.json`);
        
        if (response.ok) {
          const allQuestions = await response.json();
          console.log(`Found ${allQuestions.length} questions for ${majorName} at ${school}`);
          
          // Categorize questions by type
          const interestQuestions = allQuestions.filter((q: any) => 
            q.criterion.toLowerCase().includes('interest')
          );
          
          const skillQuestions = allQuestions.filter((q: any) => 
            q.criterion.toLowerCase().includes('skill')
          );
          
          const experienceQuestions = allQuestions.filter((q: any) => 
            q.criterion.toLowerCase().includes('experience') || 
            q.criterion.toLowerCase().includes('background')
          );
          
          // Try to get one question from each category
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
                major: `${majorName} at ${school}`,
                question: {
                  ...question,
                  category: category.name
                }
              });
            }
          }
          
          // We found questions for this major/school, no need to try other schools
          break;
        } else {
          console.log(`No questions found for ${majorName} at ${school}`);
        }
      } catch (error) {
        console.error(`Error loading questions for ${majorName} at ${school}:`, error);
        // Continue to next school
      }
    }
  };
  
  // Scroll handling for progress bar
  useEffect(() => {
    const handleScroll = () => {
      if (!questionsRef.current) return;
      
      const windowHeight = window.innerHeight;
      const documentHeight = questionsRef.current.scrollHeight;
      const scrolled = window.scrollY;
      
      const progress = Math.min(100, Math.round((scrolled / (documentHeight - windowHeight)) * 100));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Handle response changes - ensure multiple words can be typed
const handleResponseChange = (value: string) => {
  if (currentQuestionIndex >= questions.length) return;

  const currentQuestion = questions[currentQuestionIndex];
  const questionId = currentQuestion.uniqueId || currentQuestion.question.id;

  setResponses(prev => ({
    ...prev,
    [questionId]: { 
      response: value,
      skipped: false 
    }
  }));
};
  
  // Navigate to next question - now properly handling empty responses
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Save current response
      const currentQuestion = questions[currentQuestionIndex];
      const currentQuestionId = currentQuestion.uniqueId || currentQuestion.question.id;
      const currentResponseText = responses[currentQuestionId]?.response || '';
      
      // Check if response is empty and mark as skipped if it is
      if (currentResponseText.trim() === '') {
        setResponses(prev => ({
          ...prev,
          [currentQuestionId]: { 
            response: '',
            skipped: true 
          }
        }));
        
        // Cache the skipped status immediately
        try {
          const updatedResponses = {
            ...responses,
            [currentQuestionId]: {
              response: '',
              skipped: true
            }
          };
          localStorage.setItem('openEndedQuizResponses', JSON.stringify(updatedResponses));
          console.log(`Cached skipped status for empty response for question ${currentQuestionId}`);
        } catch (error) {
          console.error("Error caching skipped status:", error);
        }
      }
      
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };
  
  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      // Save current response
      const currentQuestion = questions[currentQuestionIndex];
      const currentQuestionId = currentQuestion.uniqueId || currentQuestion.question.id;
      const currentResponseText = responses[currentQuestionId]?.response || '';
      
      if (currentResponseText.trim() !== '') {
        // If response isn't empty, save as answered
        setResponses(prev => ({
          ...prev,
          [currentQuestionId]: { 
            response: currentResponseText,
            skipped: false 
          }
        }));
      }
      
      // Move to previous question
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Skip current question
  const handleSkip = () => {
    if (currentQuestionIndex >= questions.length) return;

    const currentQuestion = questions[currentQuestionIndex];
    const questionId = currentQuestion.uniqueId || currentQuestion.question.id;
    
    // Mark question as skipped
    const updatedResponses = {
      ...responses,
      [questionId]: { 
        response: '',
        skipped: true 
      }
    };
    
    setResponses(updatedResponses);
    
    // Cache the skipped status immediately
    try {
      localStorage.setItem('openEndedQuizResponses', JSON.stringify(updatedResponses));
      console.log(`Cached skipped status for question ${questionId}`);
    } catch (error) {
      console.error("Error caching skipped status:", error);
    }

    // Move to next question or submit if this is the last one
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };
  
  // Submit all responses - ensure empty responses are saved as skipped
  const handleSubmit = async () => {
    if (!userId) {
      toast({
        title: "Not Logged In",
        description: "Please log in to save your responses.",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    setSubmissionError(null);
    
    try {
      // Check for any unanswered questions in the final screen and mark as skipped
      const currentQuestion = questions[currentQuestionIndex];
      if (currentQuestion) {
        const currentQuestionId = currentQuestion.uniqueId || currentQuestion.question.id;
        const currentResponseText = responses[currentQuestionId]?.response || '';
        
        if (currentResponseText.trim() === '') {
          setResponses(prev => ({
            ...prev,
            [currentQuestionId]: { 
              response: '',
              skipped: true 
            }
          }));
        }
      }
      
      // Prepare responses for database - now using the updated open_ended_responses table
      const responsesToSubmit = Object.entries(responses).map(([questionId, responseData]) => {
        // Find the question based on uniqueId or fallback to question.id
        const questionInfo = questions.find(q => 
          (q.uniqueId && q.uniqueId === questionId) || q.question.id === questionId
        );
        
        if (!questionInfo) {
          console.log(`Question not found for ID: ${questionId}`);
          return null;
        }
        
        // Always save empty responses with skipped=true
        const isSkipped = responseData.skipped || responseData.response.trim() === '';
        
        const dataToSave = {
          user_id: userId,
          question_id: questionInfo.question.id, // Use the original question ID for DB storage
          response: responseData.response,
          skipped: isSkipped, // Set skipped to true for empty responses
          major: questionInfo?.major || '',
          question: questionInfo?.question?.question || ''
        };
        
        console.log(`Preparing to submit response for ${questionId}:`, dataToSave);
        return dataToSave;
      }).filter(item => item !== null) as any[]; // Filter out null entries
      
      // Filter out any undefined responses (shouldn't happen but just in case)
      const validResponses = responsesToSubmit.filter(r => r !== undefined);
      
      console.log("Submitting responses to open_ended_responses table:", validResponses);
      
      // Upload responses to Supabase open_ended_responses table
      const { error, data } = await supabase
        .from('open_ended_responses')
        .insert(validResponses);
        
      if (error) {
        console.error("Error inserting into open_ended_responses:", error);
        throw new Error(error.message);
      }
      
      console.log("Responses saved successfully:", data);
      
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
        
        // Clear cached responses after successful submission
        localStorage.removeItem('openEndedQuizResponses');
        console.log("Cleared cached responses after successful submission");
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
      setSubmissionError(error instanceof Error ? error.message : 'An unknown error occurred');
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your responses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle clicking on a question directly
  const handleQuestionClick = (index: number) => {
    // Save current response before switching
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const currentQuestion = questions[currentQuestionIndex];
      const currentQuestionId = currentQuestion.uniqueId || currentQuestion.question.id;
      const currentResponseText = responses[currentQuestionId]?.response || '';
      
      if (currentResponseText.trim() !== '') {
        // If response isn't empty, save as answered
        setResponses(prev => ({
          ...prev,
          [currentQuestionId]: { 
            response: currentResponseText,
            skipped: false 
          }
        }));
      }
      
      // Set new current question index
      setCurrentQuestionIndex(index);
    }
  };
  
  // Calculate progress percentage
  const progress = questions.length > 0 
    ? Math.round(((currentQuestionIndex + 1) / questions.length) * 100) 
    : 0;

  // Handle question visibility for animations
  const handleQuestionVisible = () => {
    setVisibleCount(prev => prev + 1);
  };

  // QuestionDisplay component similar to QuizQuestion in SegmentedQuiz
  const QuestionDisplay = ({ 
    question, 
    index 
  }: { 
    question: QuizQuestion, 
    index: number 
  }) => {
    const { isCurrentlyDark } = useTheme();
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(true); // Changed to true by default
    
    // Use uniqueId if available, or fallback to original question.id
    const questionId = question.uniqueId || question.question.id;
    const currentResponse = responses[questionId] || { response: '', skipped: false };
    
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !isVisible) {
              setIsVisible(true);
              handleQuestionVisible();
            }
          });
        },
        { threshold: 0.3 }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      };
    }, [isVisible]);
    
    return (
      <div 
        ref={ref}
        id={`question-${questionId}`}
        className={`min-h-[85vh] flex flex-col justify-center p-8 md:p-16 transition-all duration-700
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}`}
      >
        <h2 className="text-3xl font-bold mb-4">{question.major}</h2>
        <div className={`max-w-3xl ${isCurrentlyDark ? 'bg-gray-800' : 'bg-white/5'} backdrop-blur-md p-8 rounded-lg border ${isCurrentlyDark ? 'border-gray-700' : 'border-white/10'} shadow-xl`}>
          <div className="mb-4">
            <Badge className="mb-2 capitalize">{question.question.category || question.question.criterion}</Badge>
            <h3 className="text-2xl font-semibold mb-6">{question.question.question}</h3>
          </div>
          
          <Textarea
            className="min-h-[150px]"
            placeholder="Type your answer here..."
            value={currentResponse.response}
            onChange={(e) => handleResponseChange(e.target.value)}
            disabled={currentResponse.skipped}
          />
          
          {currentResponse.skipped && (
            <p className="text-amber-500 italic text-sm mt-2">This question has been skipped</p>
          )}
        </div>
      </div>
    );
  };
  
  // Debug logging
  console.log("Rendering questions:", questions.length);
  console.log("Current question index:", currentQuestionIndex);
  console.log("Current question available:", questions[currentQuestionIndex]);
  console.log("Questions with uniqueIds:", questions.map(q => q.uniqueId || "no-id"));
  
  if (loading) {
    return (
      <div className={`min-h-screen ${isCurrentlyDark ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-[#f8fafc] via-[#ede9fe] to-[#f3e8ff]'}`}>
        <div className="container mx-auto p-6">
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
        </div>
      </div>
    );
  }
  
  if (questions.length === 0) {
    return (
      <div className={`min-h-screen ${isCurrentlyDark ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-[#f8fafc] via-[#ede9fe] to-[#f3e8ff]'}`}>
        <div className="container mx-auto p-6 text-center">
          <h1 className="text-3xl font-bold mb-6">Open-ended Quiz</h1>
          <Card className="p-8">
            <p className="mb-6">No questions are available at this time. Please try again later.</p>
            <Button onClick={() => navigate('/')}>Return Home</Button>
          </Card>
        </div>
      </div>
    );
  }
  
  // Display a single question at a time (current question only)
  return (
    <div className={`min-h-screen ${isCurrentlyDark ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-[#f8fafc] via-[#ede9fe] to-[#f3e8ff]'}`}>
      <div className="container mx-auto">
        <div className="sticky top-0 z-50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border-b border-purple-100 dark:border-gray-700 p-4 shadow-sm">
          <div className="mb-2 flex justify-between items-center">
            <h1 className="text-2xl font-extrabold text-purple-700 dark:text-purple-400 font-sans drop-shadow-sm">
              Open-ended Quiz
            </h1>
            <span className="text-lg font-medium text-purple-400">
              {progress}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-purple-100 dark:bg-purple-900" />
          
          {/* Authentication status indicator */}
          <div className="mt-2">
            {userId ? (
              <div className="flex items-center text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                <span>Logged in as {userId.substring(0, 8)}...</span>
              </div>
            ) : (
              <div className="flex items-center text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                <span>Not logged in - responses won't be saved</span>
              </div>
            )}
          </div>
        </div>
        
        {submissionError && (
          <Alert className="mt-4 mx-4 bg-red-50 dark:bg-red-900/20 border-red-200">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertTitle>Error saving responses</AlertTitle>
            <AlertDescription>{submissionError}</AlertDescription>
          </Alert>
        )}
        
        <div ref={questionsRef} className="pb-24">
          {/* Only render the current question */}
          {questions.length > 0 && currentQuestionIndex < questions.length && (
            <QuestionDisplay
              question={questions[currentQuestionIndex]}
              index={currentQuestionIndex}
            />
          )}
        </div>
        
        <div className="fixed bottom-8 flex flex-col items-center w-full z-40">
          {/* Question navigation dots */}
          <div className="mb-4 flex flex-wrap justify-center gap-2 max-w-md mx-auto px-4">
            {questions.map((q, idx) => {
              // Use uniqueId if available, otherwise fall back to question.id
              const questionId = q.uniqueId || q.question.id;
              const response = responses[questionId];
              let status = "not-answered";
              
              if (response) {
                if (response.skipped) {
                  status = "skipped";
                } else if (response.response.trim()) {
                  status = "answered";
                }
              }
              
              return (
                <div 
                  key={questionId}
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-xs cursor-pointer ${
                    idx === currentQuestionIndex ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                  } ${
                    status === 'answered' ? 'bg-green-500 text-white' :
                    status === 'skipped' ? 'bg-amber-500 text-white' :
                    'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => handleQuestionClick(idx)}
                >
                  {idx + 1}
                </div>
              );
            })}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 || submitting}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            
            <Button
              variant="outline"
              onClick={handleSkip}
              className="text-amber-500 border-amber-500 hover:bg-amber-500/10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md"
              disabled={submitting}
            >
              <SkipForward className="mr-2 h-4 w-4" /> Skip
            </Button>
            
            {currentQuestionIndex < questions.length - 1 ? (
              <Button 
                onClick={handleNext}
                disabled={submitting}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md"
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin mr-2">↻</span> Submitting...
                  </>
                ) : (
                  'Submit Quiz'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Debug information panel (only visible in development) */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-0 left-0 p-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs" 
            onClick={() => document.getElementById('debugPanel')?.classList.toggle('hidden')}
          >
            <Bug className="h-3 w-3 mr-1" /> Debug
          </Button>
          
          <Card id="debugPanel" className="hidden absolute bottom-10 left-0 w-80 max-h-80 overflow-auto bg-white/90 dark:bg-gray-800/90 text-xs p-2 shadow-lg">
            <ScrollArea className="h-72">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify({
                  currentIndex: currentQuestionIndex,
                  questionsCount: questions.length,
                  responseCount: Object.keys(responses).length,
                  progress,
                  userId,
                  currentQuestion: questions[currentQuestionIndex],
                  questionsWithIDs: questions.map(q => ({
                    uniqueId: q.uniqueId,
                    questionId: q.question.id,
                    major: q.major
                  })),
                  ...debugInfo
                }, null, 2)}
              </pre>
            </ScrollArea>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OpenEndedQuiz;
