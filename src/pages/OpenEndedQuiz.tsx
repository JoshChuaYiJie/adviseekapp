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
      
      console.log(`Generated ${shuffledQuestions.length} questions for the quiz`);
      
      if (shuffledQuestions.length === 0) {
        toast({
          title: "No Questions Available",
          description: "We couldn't find any questions for your recommended majors.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }
      
      setQuestions(shuffledQuestions);
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
    const formattedMajor = majorName.replace(/ /g, '_').replace(/[\/&,]/g, '_');
    
    // Determine which schools to try
    const schools = schoolName ? [schoolName] : ['NTU', 'NUS', 'SMU'];
    
    // Try each school
    for (const school of schools) {
      try {
        console.log(`Trying to load questions for ${formattedMajor}_${school}.json`);
        
        const response = await fetch(`/quiz_refer/Open_ended_quiz_questions/${formattedMajor}_${school}.json`);
        
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
        }
      } catch (error) {
        console.error(`Error loading questions for ${majorName} at ${school}:`, error);
        // Continue to next school
      }
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
    
    // Cache the response immediately
    try {
      const updatedResponses = {
        ...responses,
        [questionId]: {
          response: value,
          skipped: false
        }
      };
      localStorage.setItem('openEndedQuizResponses', JSON.stringify(updatedResponses));
      console.log(`Cached response for question ${questionId}:`, value);
    } catch (error) {
      console.error("Error caching response:", error);
    }
  };
  
  // Navigate to next question
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
      // Prepare responses for database - now using the updated open_ended_responses table
      const responsesToSubmit = Object.entries(responses).map(([questionId, responseData]) => {
        const questionInfo = questions.find(q => q.question.id === questionId);
        
        const dataToSave = {
          user_id: userId,
          question_id: questionId,
          response: responseData.response,
          skipped: responseData.skipped,
          major: questionInfo?.major || '',
          question: questionInfo?.question?.question || ''
        };
        
        console.log(`Preparing to submit response for ${questionId}:`, dataToSave);
        return dataToSave;
      });
      
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
      if (index < questions.length) {
        const selectedQuestionId = questions[index].question.id;
        const selectedResponse = responses[selectedQuestionId]?.response || '';
        
        const textareaElement = document.querySelector('textarea');
        if (textareaElement) {
          textareaElement.value = selectedResponse;
        }
      }
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
