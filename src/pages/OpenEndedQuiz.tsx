
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { getMatchingMajors, mapRiasecToCode, mapWorkValueToCode, formCode } from '@/utils/recommendation';
import { formatMajorForFile } from '@/components/sections/majors/MajorUtils';
import { useQuestionHandler } from '@/components/sections/majors/useQuestionHandler';
import { useRecommendationContext } from '@/contexts/RecommendationContext';

// Enhanced question interface 
interface EnhancedQuestion {
  id: string;
  question: string;
  criterion: string;
  majorName: string;
  category?: string;
  school?: string;
}

const OpenEndedQuiz = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const { isCurrentlyDark } = useTheme();
  const { toast } = useToast();
  const { majorRecommendations } = useRecommendationContext();

  const [questions, setQuestions] = useState<EnhancedQuestion[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, { response: string; skipped: boolean }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [availableMajors, setAvailableMajors] = useState<string[]>([]);

  // Load user ID on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const id = session?.user?.id || null;
      setUserId(id);

      if (!id) {
        navigate('/');
      } else {
        // Load available majors from the repeated_majors.json file
        try {
          const response = await fetch('/school-data/Standardized weights/repeated_majors.json');
          if (response.ok) {
            const data = await response.json();
            // Extract major names from the data
            const majors = data.map((item: any) => item.major);
            setAvailableMajors(majors);
          } else {
            console.error('Failed to load majors data');
          }
        } catch (error) {
          console.error('Error loading majors data:', error);
        }
      }
    };

    checkAuth();
  }, [navigate]);

  // Load questions with categorization
  useEffect(() => {
    const loadQuestionsForQuiz = async () => {
      if (!userId || availableMajors.length === 0) return;
      
      setLoadingQuestions(true);
      
      try {
        // Step 1: Randomly select majors (up to 5)
        const selectedMajors: string[] = [];
        const majorsToSelect = Math.min(5, availableMajors.length);
        const tempMajors = [...availableMajors]; // Create a copy to avoid modifying original
        
        for (let i = 0; i < majorsToSelect; i++) {
          if (tempMajors.length === 0) break;
          const randomIndex = Math.floor(Math.random() * tempMajors.length);
          selectedMajors.push(tempMajors[randomIndex]);
          tempMajors.splice(randomIndex, 1); // Remove to avoid duplicates
        }
        
        console.log('Selected majors:', selectedMajors);
        
        // Step 2: Load questions for each major
        const quizQuestions: EnhancedQuestion[] = [];
        
        for (const major of selectedMajors) {
          // Format the major name for the filename
          const formattedMajor = major.replace(/ /g, '_').replace(/[\/&,]/g, '_');
          const schools = ['NTU', 'NUS', 'SMU'];
          
          for (const school of schools) {
            try {
              const response = await fetch(`/quiz_refer/Open_ended_quiz_questions/${formattedMajor}_${school}.json`);
              
              if (response.ok) {
                const allQuestions = await response.json();
                console.log(`Found ${allQuestions.length} questions for ${major} at ${school}`);
                
                // Step 3: Categorize questions
                const interestQuestions = allQuestions.filter((q: any) => 
                  q.criterion.toLowerCase().includes('interest') || 
                  q.criterion.toLowerCase().includes('motivation'));
                
                const skillQuestions = allQuestions.filter((q: any) => 
                  q.criterion.toLowerCase().includes('skill') || 
                  q.criterion.toLowerCase().includes('technical'));
                
                const experienceQuestions = allQuestions.filter((q: any) => 
                  q.criterion.toLowerCase().includes('experience') || 
                  q.criterion.toLowerCase().includes('background'));
                
                // Any questions that don't fit into the categories above
                const otherQuestions = allQuestions.filter((q: any) => 
                  !interestQuestions.includes(q) && 
                  !skillQuestions.includes(q) && 
                  !experienceQuestions.includes(q));
                
                const categories = [
                  { name: 'interests', questions: interestQuestions },
                  { name: 'skills', questions: skillQuestions },
                  { name: 'experience', questions: experienceQuestions },
                  { name: 'general', questions: otherQuestions }
                ];
                
                // Select one question from each category if available
                for (const category of categories) {
                  if (category.questions.length > 0) {
                    const randomIndex = Math.floor(Math.random() * category.questions.length);
                    const question = category.questions[randomIndex];
                    
                    quizQuestions.push({
                      ...question,
                      majorName: `${major} at ${school}`,
                      category: category.name,
                      school: school
                    });
                  }
                }
                
                // We found questions for this major, move to the next major
                break;
              }
            } catch (error) {
              console.error(`Error loading questions for ${major} at ${school}:`, error);
              // Continue to next school
            }
          }
        }
        
        // Step 4: Shuffle questions for randomness
        const shuffledQuestions = quizQuestions.sort(() => Math.random() - 0.5);
        console.log('Loaded and shuffled questions:', shuffledQuestions.length);
        setQuestions(shuffledQuestions);
        
      } catch (error) {
        console.error('Error preparing questions:', error);
        toast({
          title: "Error",
          description: "Failed to load quiz questions. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoadingQuestions(false);
      }
    };
    
    loadQuestionsForQuiz();
  }, [userId, availableMajors, toast]);

  // Progress calculation
  const progress = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.round(((currentQuestionIndex + 1) / questions.length) * 100);
  }, [currentQuestionIndex, questions.length]);

  // Handle response change for current question
  const handleResponseChange = (value: string) => {
    if (questions.length === 0 || currentQuestionIndex >= questions.length) return;
    
    const questionId = questions[currentQuestionIndex].id;
    setAnsweredQuestions(prev => ({
      ...prev,
      [questionId]: {
        response: value,
        skipped: false
      }
    }));
  };

  // Navigate to next question
  const handleNext = () => {
    if (currentQuestionIndex >= questions.length) return;
    
    // Save the current question's response, mark as skipped if empty
    const questionId = questions[currentQuestionIndex].id;
    const currentResponse = answeredQuestions[questionId]?.response || '';
    
    if (!currentResponse.trim()) {
      setAnsweredQuestions(prev => ({
        ...prev,
        [questionId]: {
          response: '',
          skipped: true
        }
      }));
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      handleSubmit();
    }
  };

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };

  // Submit all responses
  const handleSubmit = async () => {
    if (!userId) {
      toast({
        title: "Not logged in",
        description: "Please log in to save your responses.",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Filter out skipped questions
      const responsesToSave = Object.entries(answeredQuestions)
        .filter(([_, response]) => !response.skipped)
        .map(([questionId, response]) => {
          const questionInfo = questions.find(q => q.id === questionId);
          
          return {
            user_id: userId,
            question: questionInfo?.question || '',
            response: response.response,
            major: questionInfo?.majorName || ''
          };
        });
      
      if (responsesToSave.length > 0) {
        // Save valid responses to database
        const { error } = await supabase
          .from('open_ended_responses')
          .insert(responsesToSave);
          
        if (error) {
          console.error("Error saving responses:", error);
          toast({
            title: "Error saving responses",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Responses saved successfully",
            description: `Saved ${responsesToSave.length} response(s)`,
          });
          
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
          
          setCompleted(true);
        }
      } else {
        toast({
          title: "No responses to save",
          description: "You didn't provide any responses to save.",
        });
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast({
        title: "Something went wrong",
        description: "Failed to save responses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle clicking on a question dot
  const handleQuestionClick = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  if (loadingQuestions) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Loading Questions...</CardTitle>
          <CardDescription>Please wait while we prepare your quiz.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full"></div>
            <div className="h-24 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (completed) {
    return (
      <Card className="w-full text-center">
        <CardHeader>
          <CardTitle>Quiz Completed!</CardTitle>
          <CardDescription>Thank you for completing the quiz.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center my-6">
            <Check className="h-24 w-24 text-green-500" />
          </div>
          <p>Your responses have been saved successfully.</p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </CardFooter>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="w-full text-center">
        <CardHeader>
          <CardTitle>No Questions Available</CardTitle>
          <CardDescription>
            We couldn't find any questions based on your recommended majors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please try again later or complete the major recommendation quiz first.</p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </CardFooter>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const questionId = currentQuestion.id;
  const currentResponse = answeredQuestions[questionId] || { response: '', skipped: false };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Card className={`w-full transition-all duration-300 ${isCurrentlyDark ? 'bg-gray-800' : 'bg-white'}`}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                {currentQuestion.majorName || 'Open-ended Question'}
              </CardTitle>
              <CardDescription>
                Question {currentQuestionIndex + 1} of {questions.length}
              </CardDescription>
            </div>
            <Badge variant="outline" className="capitalize">
              {currentQuestion.category || currentQuestion.criterion}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{Math.round(progress)}% Complete</span>
              <span>{currentQuestionIndex + 1} of {questions.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <p className="text-lg">{currentQuestion.question}</p>
            
            <Textarea
              placeholder="Type your answer here..."
              className="min-h-[150px]"
              value={currentResponse.response}
              onChange={(e) => handleResponseChange(e.target.value)}
              disabled={submitting}
            />
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {questions.map((q, idx) => {
              const response = answeredQuestions[q.id];
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
                  key={q.id} 
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-xs cursor-pointer ${
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
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0 || submitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          
          {currentQuestionIndex < questions.length - 1 ? (
            <Button 
              onClick={handleNext}
              disabled={submitting}
            >
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
        </CardFooter>
      </Card>
    </div>
  );
};

export default OpenEndedQuiz;
