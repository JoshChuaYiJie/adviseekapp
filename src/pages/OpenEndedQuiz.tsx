
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, SkipForward } from 'lucide-react';
import { formatMajorForFile } from '@/components/sections/majors/MajorUtils';
import { useRecommendationContext } from '@/contexts/RecommendationContext';

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
  const [responses, setResponses] = useState<Record<string, { response: string; skipped: boolean }>>({});
  
  // Use context to get recommended majors
  const { majorRecommendations } = useRecommendationContext();
  
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
        // All requirements met, prepare the quiz using global majors
        prepareQuizQuestionsFromRecommendations();
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
  
  // New function: Prepare questions using recommended majors from context
  const prepareQuizQuestionsFromRecommendations = async () => {
    try {
      setLoading(true);
      console.log("Preparing questions from recommendations context");
      
      // Get recommended majors from the context
      let recommendedMajors: string[] = [];
      
      if (majorRecommendations) {
        // Combine all recommended majors from the context
        recommendedMajors = [
          ...(majorRecommendations.exactMatches || []),
          ...(majorRecommendations.permutationMatches || []),
          ...(majorRecommendations.riasecMatches || []),
          ...(majorRecommendations.workValueMatches || [])
        ];
        
        // Remove duplicates
        recommendedMajors = [...new Set(recommendedMajors)];
        
        console.log("Using recommended majors from context:", recommendedMajors);
      } else {
        console.log("No recommendations found in context");
        
        toast({
          title: "No Recommendations",
          description: "We couldn't find any major recommendations. Please complete the other quizzes first.",
          variant: "destructive"
        });
        
        navigate('/');
        return;
      }
      
      // If we have recommended majors, use them for questions
      if (recommendedMajors.length > 0) {
        // Select up to 5 majors
        const selectedMajors = recommendedMajors.slice(0, 5);
        
        console.log("Selected majors for quiz:", selectedMajors);
        
        // For each selected major, load and select questions
        const quizQuestions: QuizQuestion[] = [];
        
        for (const major of selectedMajors) {
          try {
            // Format major for file lookup
            const [majorName, school] = major.split(' at ');
            const formattedMajor = formatMajorForFile(majorName, school || '');
            
            // Try to load questions with school suffix
            await loadQuestionsWithSchoolSuffix(major, quizQuestions);
          } catch (error) {
            console.error(`Error loading questions for ${major}:`, error);
          }
        }
        
        // Shuffle the questions for variety
        const shuffledQuestions = quizQuestions.sort(() => Math.random() - 0.5);
        console.log(`Final quiz generated with ${shuffledQuestions.length} questions from recommended majors`);
        setQuestions(shuffledQuestions);
        
        if (shuffledQuestions.length === 0) {
          console.log("No questions found for recommended majors");
          toast({
            title: "No Questions Available",
            description: "Could not load questions for the recommended majors. Please try again later.",
            variant: "destructive"
          });
          navigate('/');
        }
      } else {
        console.log("No recommended majors found");
        toast({
          title: "No Recommendations",
          description: "No recommended majors were found. Please complete the other quizzes first.",
          variant: "destructive"
        });
        navigate('/');
      }
      
    } catch (error) {
      console.error('Error preparing quiz questions from recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to prepare quiz questions. Please try again later.",
        variant: "destructive"
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to try loading questions with school suffix
  const loadQuestionsWithSchoolSuffix = async (major: string, quizQuestions: QuizQuestion[]) => {
    try {
      // Try to formalize the filename format with school suffix
      const [majorName, schoolName] = major.split(' at ');
      const formattedMajor = majorName.replace(/ /g, '_').replace(/[\/&,]/g, '_');
      const schools = schoolName ? [schoolName] : ['NTU', 'NUS', 'SMU'];
      
      let foundQuestions = false;
      
      for (const school of schools) {
        try {
          const response = await fetch(`/quiz_refer/Open_ended_quiz_questions/${formattedMajor}_${school}.json`);
          
          if (response.ok) {
            const allQuestions = await response.json();
            console.log(`Found ${allQuestions.length} questions for ${majorName} at ${school}`);
            
            // Categorize questions
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
                  major: `${majorName} at ${school}`,
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
          console.error(`Error loading questions for ${majorName} at ${school}:`, error);
          // Continue to next school
        }
      }
      
      return foundQuestions;
    } catch (error) {
      console.error(`Error in loadQuestionsWithSchoolSuffix for ${major}:`, error);
      return false;
    }
  };
  
  // Handle response changes
  const handleResponseChange = (value: string) => {
    if (currentQuestionIndex >= questions.length) return;
    
    const questionId = questions[currentQuestionIndex].question.id;
    setResponses(prev => ({
      ...prev,
      [questionId]: { 
        response: value,
        skipped: false 
      }
    }));
  };
  
  // Navigate to next question - UPDATED to reset the response box
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Save current response
      const currentQuestionId = questions[currentQuestionIndex].question.id;
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
      
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      
      // Clear textarea when moving to next question
      const textareaElement = document.querySelector('textarea');
      if (textareaElement) {
        textareaElement.value = responses[questions[currentQuestionIndex + 1].question.id]?.response || '';
      }
    } else {
      handleSubmit();
    }
  };
  
  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      // Save current response
      const currentQuestionId = questions[currentQuestionIndex].question.id;
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
      
      // Load the previous response into textarea
      const previousQuestionId = questions[currentQuestionIndex - 1].question.id;
      const previousResponse = responses[previousQuestionId]?.response || '';
      
      const textareaElement = document.querySelector('textarea');
      if (textareaElement) {
        textareaElement.value = previousResponse;
      }
    }
  };

  // Skip current question
  const handleSkip = () => {
    if (currentQuestionIndex >= questions.length) return;

    const questionId = questions[currentQuestionIndex].question.id;
    
    // Mark question as skipped
    setResponses(prev => ({
      ...prev,
      [questionId]: { 
        response: '',
        skipped: true 
      }
    }));

    // Move to next question or submit if this is the last one
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      
      // Clear textarea when skipping to next question
      const textareaElement = document.querySelector('textarea');
      if (textareaElement) {
        textareaElement.value = responses[questions[currentQuestionIndex + 1].question.id]?.response || '';
      }
    } else {
      handleSubmit();
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
    
    setSubmitting(true);
    try {
      // Prepare responses for database - now using the new open_ended_responses table
      const responsesToSubmit = Object.entries(responses).map(([questionId, responseData]) => {
        const questionInfo = questions.find(q => q.question.id === questionId);
        
        return {
          user_id: userId,
          question_id: questionId,
          response: responseData.response,
          skipped: responseData.skipped,
          major: questionInfo?.major || '',
          question: questionInfo?.question?.question || ''
        };
      });
      
      // Filter out any undefined responses (shouldn't happen but just in case)
      const validResponses = responsesToSubmit.filter(r => r !== undefined);
      
      console.log("Submitting responses to open_ended_responses table:", validResponses);
      
      // Upload responses to Supabase open_ended_responses table
      const { error } = await supabase
        .from('open_ended_responses')
        .insert(validResponses);
        
      if (error) {
        console.error("Error inserting into open_ended_responses:", error);
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
  
  // Handle clicking on a question directly
  const handleQuestionClick = (index: number) => {
    // Save current response before switching
    const currentQuestionId = questions[currentQuestionIndex].question.id;
    const currentResponseText = document.querySelector('textarea')?.value || '';
    
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
    
    // Load the selected question's response into textarea
    const selectedQuestionId = questions[index].question.id;
    const selectedResponse = responses[selectedQuestionId]?.response || '';
    
    const textareaElement = document.querySelector('textarea');
    if (textareaElement) {
      textareaElement.value = selectedResponse;
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
  const questionId = currentQuestion?.question?.id;
  const currentResponse = responses[questionId] || { response: '', skipped: false };
  
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
            value={currentResponse.response}
            onChange={(e) => handleResponseChange(e.target.value)}
            disabled={currentResponse.skipped}
          />
          
          {currentResponse.skipped && (
            <p className="text-amber-500 italic text-sm mt-2">This question has been skipped</p>
          )}
        </div>
        
        <div className="flex justify-between mt-6">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            
            <Button
              variant="outline"
              onClick={handleSkip}
              className="text-amber-500 border-amber-500 hover:bg-amber-500/10"
            >
              <SkipForward className="mr-2 h-4 w-4" /> Skip
            </Button>
          </div>
          
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
      
      {/* Question status indicators */}
      <div className="mt-6">
        <h3 className="font-medium mb-2">Question Status:</h3>
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, idx) => {
            const qResponse = responses[q.question.id];
            let status = "not-answered";
            
            if (qResponse) {
              if (qResponse.skipped) {
                status = "skipped";
              } else if (qResponse.response.trim()) {
                status = "answered";
              }
            }
            
            return (
              <div 
                key={q.question.id} 
                className={`w-full p-2 flex items-center justify-center rounded-md text-xs cursor-pointer ${
                  idx === currentQuestionIndex ? 'ring-2 ring-blue-500' : ''
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
      </div>
      
      {/* Debug information panel (only visible in development) */}
      {import.meta.env.DEV && (
        <div className="mt-8 p-4 border border-gray-300 rounded-md">
          <h3 className="font-semibold mb-2">Debug Information</h3>
          <pre className="text-xs overflow-auto bg-gray-100 dark:bg-gray-800 p-2 rounded">
            {JSON.stringify({
              ...debugInfo,
              currentUserId: userId,
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
