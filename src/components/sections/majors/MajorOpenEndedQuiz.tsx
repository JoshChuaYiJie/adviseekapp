
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
import { ArrowLeft, ArrowRight, SkipForward, Check } from 'lucide-react';
import { getMatchingMajors, mapRiasecToCode, mapWorkValueToCode, formCode } from '@/utils/recommendation';
import { formatMajorForFile } from '@/components/sections/majors/MajorUtils';
import { useQuestionHandler } from './useQuestionHandler';

interface MajorOpenEndedQuizProps {
  major: string | null;
}

const MajorOpenEndedQuiz: React.FC<MajorOpenEndedQuizProps> = ({ major }) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const { isCurrentlyDark } = useTheme();
  const { toast } = useToast();

  const {
    questions,
    loadingQuestions,
    answeredQuestions,
    setAnsweredQuestions,
    submitting,
    completed,
    loadQuestions,
    handleSubmitResponses,
    recommendedMajors,
    loadingRecommendations,
    prepareQuestionsForRecommendedMajors
  } = useQuestionHandler({ userId });

  // Load user ID on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const id = session?.user?.id || null;
      setUserId(id);

      if (!id) {
        navigate('/');
      }
    };

    checkAuth();
  }, []);

  // Load questions when major changes
  useEffect(() => {
    if (userId && major) {
      loadQuestions(major);
    } else if (userId && !major && recommendedMajors.length > 0) {
      // If no specific major is provided, use recommended majors
      prepareQuestionsForRecommendedMajors();
    }
  }, [userId, major, recommendedMajors]);

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
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };

  // Skip current question
  const handleSkip = () => {
    const questionId = questions[currentQuestionIndex].id;
    
    setAnsweredQuestions(prev => ({
      ...prev,
      [questionId]: {
        response: '',
        skipped: true
      }
    }));
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      handleSubmit();
    }
  };

  // Submit all responses
  const handleSubmit = () => {
    handleSubmitResponses(major);
  };

  // Handle clicking on a question dot
  const handleQuestionClick = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  if (loadingQuestions || loadingRecommendations) {
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
            {major ? `We couldn't find any questions for ${major}.` : 'We couldn\'t load any questions.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please try again later or select a different major.</p>
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
    <div className="w-full">
      <Card className={`w-full transition-all duration-300 ${isCurrentlyDark ? 'bg-gray-800' : 'bg-white'}`}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                {currentQuestion.majorName || major || 'Quiz Question'}
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
              disabled={submitting || currentResponse.skipped}
            />
            
            {currentResponse.skipped && (
              <p className="text-amber-500 italic text-sm">You skipped this question</p>
            )}
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
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 || submitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={submitting || currentResponse.skipped}
              className="text-amber-500 border-amber-500 hover:bg-amber-500/10"
            >
              <SkipForward className="mr-2 h-4 w-4" /> Skip
            </Button>
          </div>
          
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

export default MajorOpenEndedQuiz;
