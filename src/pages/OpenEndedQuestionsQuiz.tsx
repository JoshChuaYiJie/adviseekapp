
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OpenEndedQuestion } from '@/components/sections/majors/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMajorForFile } from '@/components/sections/majors/MajorUtils';

const OpenEndedQuestionsQuiz = () => {
  const { isCurrentlyDark } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<OpenEndedQuestion[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Fetch user authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          title: "Not logged in",
          description: "Please log in to take the quiz",
          variant: "destructive"
        });
        navigate('/');
        return;
      }
      
      setUserId(session.user.id);
    };
    
    checkAuth();
  }, [navigate, toast]);
  
  // Fetch recommended majors based on user's RIASEC and work values
  useEffect(() => {
    const fetchRecommendedMajors = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        // Fetch RIASEC profile
        const { data: riasecData } = await supabase
          .from('user_responses')
          .select('component, score')
          .eq('user_id', userId)
          .eq('quiz_type', 'riasec');
        
        // Fetch Work Value profile
        const { data: workValueData } = await supabase
          .from('user_responses')
          .select('component, score')
          .eq('user_id', userId)
          .eq('quiz_type', 'work_value');
        
        if (!riasecData?.length || !workValueData?.length) {
          toast({
            title: "Missing profile data",
            description: "Please complete the RIASEC and Work Values quizzes first",
            variant: "destructive"
          });
          navigate('/');
          return;
        }
        
        // Get top 3 components for each profile
        const topRiasec = riasecData
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map(item => item.component.charAt(0))
          .join('');
          
        const topWorkValue = workValueData
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map(item => item.component.charAt(0))
          .join('');
        
        console.log("User profiles:", { topRiasec, topWorkValue });
        
        // Load the occupation-major mappings
        const mappingsResponse = await fetch('/quiz_refer/occupation_major_mappings.json');
        const mappings = await mappingsResponse.json();
        
        // Score each major based on RIASEC and work value match
        const scoredMajors = mappings.map((mapping: any) => {
          let score = 0;
          
          // Score based on RIASEC match (for each matching letter)
          if (mapping.RIASEC_code) {
            for (const letter of topRiasec) {
              if (mapping.RIASEC_code.includes(letter)) {
                score += 1;
              }
            }
          }
          
          // Score based on work value match (for each matching letter)
          if (mapping.work_value_code) {
            for (const letter of topWorkValue) {
              if (mapping.work_value_code.includes(letter)) {
                score += 1;
              }
            }
          }
          
          return {
            major: mapping.majors?.[0] || 'General',
            score
          };
        });
        
        // Get top 5 scored majors
        const topMajors = scoredMajors
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 5);
        
        console.log("Top majors:", topMajors);
        
        // Load questions for each top major
        const loadQuestionsForMajor = async (major: string) => {
          try {
            // Extract school from major if present (e.g., "Major at NUS")
            let school = '';
            let majorName = major;
            
            if (major.includes(' at ')) {
              const parts = major.split(' at ');
              majorName = parts[0];
              school = parts[1] || '';
            }
            
            // Format file path
            const formattedMajor = formatMajorForFile(majorName, school);
            const filePath = `/quiz_refer/Open_ended_quiz_questions/${formattedMajor}.json`;
            
            console.log(`Attempting to load questions from: ${filePath}`);
            
            // Fetch the questions
            const response = await fetch(filePath);
            
            if (!response.ok) {
              console.error(`Failed to load questions for ${major} (${filePath})`);
              return [];
            }
            
            const majorQuestions = await response.json();
            
            // Add major and school info to each question
            return majorQuestions.map((q: OpenEndedQuestion) => ({
              ...q,
              major: majorName,
              school: school
            }));
          } catch (error) {
            console.error(`Error loading questions for ${major}:`, error);
            return [];
          }
        };
        
        // Load questions for all top majors
        const allQuestionsPromises = topMajors.map(majorItem => 
          loadQuestionsForMajor(majorItem.major)
        );
        
        const allMajorQuestions = await Promise.all(allQuestionsPromises);
        
        // Flatten and filter questions by criteria
        const flatQuestions = allMajorQuestions.flat();
        
        // Group questions by criteria to ensure balanced selection
        const questionsByMajorAndCriteria: Record<string, Record<string, OpenEndedQuestion[]>> = {};
        
        flatQuestions.forEach(question => {
          const majorKey = `${question.major}${question.school ? ` at ${question.school}` : ''}`;
          
          if (!questionsByMajorAndCriteria[majorKey]) {
            questionsByMajorAndCriteria[majorKey] = {};
          }
          
          if (!questionsByMajorAndCriteria[majorKey][question.criterion]) {
            questionsByMajorAndCriteria[majorKey][question.criterion] = [];
          }
          
          questionsByMajorAndCriteria[majorKey][question.criterion].push(question);
        });
        
        // Select a balanced set of questions (1 per criteria per major)
        const selectedQuestions: OpenEndedQuestion[] = [];
        
        Object.entries(questionsByMajorAndCriteria).forEach(([majorKey, criteriaMap]) => {
          Object.entries(criteriaMap).forEach(([criterion, criterionQuestions]) => {
            // Randomly select one question per criteria
            if (criterionQuestions.length > 0) {
              const randomIndex = Math.floor(Math.random() * criterionQuestions.length);
              selectedQuestions.push(criterionQuestions[randomIndex]);
            }
          });
        });
        
        console.log(`Loaded ${selectedQuestions.length} questions from ${topMajors.length} majors`);
        
        // Add generic questions if we don't have enough
        if (selectedQuestions.length === 0) {
          selectedQuestions.push(
            {
              id: 'generic-interests',
              question: 'Describe your interests in your chosen field of study.',
              criterion: 'Interests',
              major: 'General'
            },
            {
              id: 'generic-skills',
              question: 'What skills do you have that are relevant to your academic goals?',
              criterion: 'Skills',
              major: 'General'
            },
            {
              id: 'generic-experiences',
              question: 'Describe any experiences that have prepared you for university.',
              criterion: 'Experiences',
              major: 'General'
            }
          );
        }
        
        setQuestions(selectedQuestions);
        setProgress(0);
      } catch (error) {
        console.error('Error loading questions:', error);
        toast({
          title: "Error",
          description: "Failed to load quiz questions. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendedMajors();
  }, [userId, navigate, toast]);
  
  // Calculate progress
  useEffect(() => {
    if (questions.length > 0) {
      setProgress(Math.round((currentQuestionIndex / questions.length) * 100));
    }
  }, [currentQuestionIndex, questions.length]);
  
  // Handle response changes
  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  // Navigate to next question
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  // Submit responses
  const handleSubmitResponses = async () => {
    if (!userId) {
      toast({
        title: "Not Logged In",
        description: "Please log in to save your responses.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate all questions are answered
    const unansweredQuestions = questions.filter(q => 
      !responses[q.id || ''] || responses[q.id || ''].trim() === ''
    );

    if (unansweredQuestions.length > 0) {
      toast({
        title: "Missing responses",
        description: "Please answer all questions before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    try {
      // Prepare responses for database
      const responsesToSubmit = questions.map(question => ({
        user_id: userId,
        question_id: question.id || '',
        response: responses[question.id || ''] || '',
        quiz_type: 'open-ended',
        component: question.criterion // Store the criterion as component
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
      } else {
        toast({
          title: "Responses Submitted",
          description: "Your responses have been successfully submitted!",
          variant: "default"
        });
        navigate('/');
      }
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
  
  // Current question
  const currentQuestion = questions[currentQuestionIndex];
  
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        <div className="mb-6 flex flex-col gap-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Open-ended Questions Quiz</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Answer questions about your interests, skills, and experiences related to potential majors.
        </p>
      </div>
      
      <div className="mb-6">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm mt-1">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>{progress}% complete</span>
        </div>
      </div>
      
      {currentQuestion && (
        <Card className={`p-4 mb-6 ${isCurrentlyDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge>{currentQuestion.criterion}</Badge>
              {currentQuestion.major && currentQuestion.major !== 'General' && (
                <Badge variant="outline">{currentQuestion.major}</Badge>
              )}
              {currentQuestion.school && (
                <Badge variant="outline" className="bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {currentQuestion.school}
                </Badge>
              )}
            </div>
            <p className="text-md font-medium">{currentQuestion.question}</p>
            
            <Textarea
              className={`mt-2 ${isCurrentlyDark ? 'bg-gray-700' : 'bg-gray-50'}`}
              placeholder="Type your answer here..."
              rows={6}
              value={responses[currentQuestion.id || ''] || ''}
              onChange={(e) => handleResponseChange(currentQuestion.id || '', e.target.value)}
            />
          </div>
        </Card>
      )}
      
      <div className="flex justify-between mt-4">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        
        {currentQuestionIndex < questions.length - 1 ? (
          <Button 
            onClick={handleNext}
            disabled={!responses[currentQuestion?.id || '']?.trim()}
          >
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleSubmitResponses} 
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {submitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></span>
                Submitting...
              </>
            ) : (
              <>Submit Answers</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default OpenEndedQuestionsQuiz;
