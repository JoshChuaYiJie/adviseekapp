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
  
  // Load user data and prepare quiz
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      setLoading(true);
      
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || null;
      setUserId(currentUserId);
      
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
      
      // Check if prerequisites are completed
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
      
      const completedTypes = completions?.map(c => c.quiz_type) || [];
      const requiredQuizzes = ["interest-part 1", "interest-part 2", "competence", "work-values"];
      const allCompleted = requiredQuizzes.every(quiz => completedTypes.includes(quiz));
      
      if (!allCompleted) {
        toast({
          title: "Prerequisites Not Met",
          description: "Please complete all required quizzes before taking the open-ended quiz.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }
      
      // Generate questions based on user's profile
      await prepareQuizQuestions();
      
      setLoading(false);
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
    } catch (error) {
      console.error('Error loading user profiles:', error);
    }
  };
  
  // Prepare quiz questions based on recommended majors
  const prepareQuizQuestions = async () => {
    try {
      // Get top 3 RIASEC components
      const topRiasec = riasecProfile.slice(0, 3);
      
      // Get top 3 Work Values components
      const topWorkValues = workValueProfile.slice(0, 3);
      
      if (topRiasec.length === 0 || topWorkValues.length === 0) {
        toast({
          title: "Profile Incomplete",
          description: "Please complete all quizzes to generate your profile before taking this quiz.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }
      
      // Fetch all majors from the standardized weights files
      const [ntuMajors, nusMajors, smuMajors] = await Promise.all([
        fetch('/school-data/Standardized weights/standardized_ntu_majors.json').then(r => r.json()),
        fetch('/school-data/Standardized weights/standardized_nus_majors.json').then(r => r.json()),
        fetch('/school-data/Standardized weights/standardized_smu_majors.json').then(r => r.json())
      ]);
      
      // Get unique majors from all schools (just grab 5 for variety)
      const allPrograms = [
        ...ntuMajors.programs, 
        ...nusMajors.programs,
        ...smuMajors.programs
      ];
      
      // Randomly select 5 majors for the quiz
      const selectedMajors = [];
      const majorCount = Math.min(5, allPrograms.length);
      
      for (let i = 0; i < majorCount; i++) {
        const randomIndex = Math.floor(Math.random() * allPrograms.length);
        selectedMajors.push(allPrograms[randomIndex].major);
        allPrograms.splice(randomIndex, 1);
      }
      
      // For each selected major, load and select questions
      const quizQuestions: QuizQuestion[] = [];
      
      for (const major of selectedMajors) {
        try {
          // Try to formalize the filename format
          const formattedMajor = major.replace(/ /g, '_').replace(/[\/&,]/g, '_');
          const schools = ['NTU', 'NUS', 'SMU'];
          
          // Try each school suffix until we find one that works
          for (const school of schools) {
            try {
              const response = await fetch(`/quiz_refer/Open_ended_quiz_questions/${formattedMajor}_${school}.json`);
              
              if (response.ok) {
                const allQuestions = await response.json();
                
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
                    
                    // Only take one question per major to keep the quiz short
                    break;
                  }
                }
                
                // Found questions for this major, move to next major
                break;
              }
            } catch (error) {
              console.error(`Error loading questions for ${major} at ${school}:`, error);
              // Continue to next school
            }
          }
        } catch (error) {
          console.error(`Could not load questions for ${major}:`, error);
        }
      }
      
      // Shuffle the questions for variety
      const shuffledQuestions = quizQuestions.sort(() => Math.random() - 0.5);
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
      console.error('Error preparing quiz questions:', error);
      toast({
        title: "Error",
        description: "Failed to prepare quiz questions. Please try again later.",
        variant: "destructive"
      });
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
    </div>
  );
};

export default OpenEndedQuiz;
