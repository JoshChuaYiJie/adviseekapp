
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useTheme } from "@/contexts/ThemeContext";
import { Skeleton } from '@/components/ui/skeleton';
import { OpenEndedQuestion } from './types';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';

export const OpenEndedQuiz = () => {
  const { toast } = useToast();
  const { isCurrentlyDark } = useTheme();
  const [questions, setQuestions] = useState<OpenEndedQuestion[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  // Fetch a random selection of questions across all majors
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
        }
        
        // Check if user has already completed this quiz
        if (session?.user) {
          const { data: completionData } = await supabase
            .from('quiz_completion')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('quiz_type', 'open-ended')
            .single();
            
          if (completionData) {
            setCompleted(true);
          }
        }
        
        // Create array of criteria we want to include
        const criteriaTypes = ['Interests', 'Skills', 'Experiences'];
        
        // Fetch available question files
        const response = await fetch('/quiz_refer/occupation_major_mappings.json');
        if (!response.ok) {
          throw new Error('Failed to load majors data');
        }
        
        const mappings = await response.json();
        
        // Get a random selection of majors (limit to 5)
        const allMajors = mappings.flatMap((mapping: any) => mapping.majors || []);
        const uniqueMajors = [...new Set(allMajors)];
        
        // Randomly select up to 5 majors
        const selectedMajors = uniqueMajors.sort(() => 0.5 - Math.random()).slice(0, 5);
        
        // For each selected major, attempt to load their questions
        const allQuestions: OpenEndedQuestion[] = [];
        
        for (const major of selectedMajors) {
          try {
            // Format major name for file path
            const majorFormatted = major.replace(/\s+/g, '_').replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
            let schoolSuffix = '';
            
            // Check if major contains school information
            if (major.includes(' at ')) {
              const [majorName, school] = major.split(' at ');
              schoolSuffix = '_' + school.trim().replace(/\s+/g, '_');
            }
            
            const fileName = `${majorFormatted}${schoolSuffix}.json`;
            
            // Attempt to fetch questions for this major
            const majorQuestionsResponse = await fetch(`/quiz_refer/Open_ended_quiz_questions/${fileName}`);
            
            if (majorQuestionsResponse.ok) {
              const majorQuestions = await majorQuestionsResponse.json();
              
              // For each criteria type, select one random question
              for (const criteria of criteriaTypes) {
                const questionsOfType = majorQuestions.filter((q: OpenEndedQuestion) => 
                  q.criterion === criteria
                );
                
                if (questionsOfType.length > 0) {
                  // Select random question from this criteria
                  const randomQuestion = questionsOfType[Math.floor(Math.random() * questionsOfType.length)];
                  
                  // Add major information to the question
                  allQuestions.push({
                    ...randomQuestion,
                    major: major
                  });
                }
              }
            }
          } catch (error) {
            console.error(`Error loading questions for major ${major}:`, error);
          }
        }
        
        // Ensure we have questions - if not, add some generic fallback questions
        if (allQuestions.length === 0) {
          allQuestions.push(
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
        
        // Update state with loaded questions
        setQuestions(allQuestions);
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
    
    fetchQuestions();
  }, [toast]);

  // Handle response changes
  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
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
        setCompleted(true);
        toast({
          title: "Responses Submitted",
          description: "Your responses have been successfully submitted!",
          variant: "default"
        });
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

  if (completed) {
    return (
      <div className="p-6 bg-green-50 dark:bg-green-900 rounded-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Quiz Completed!</h2>
        <p className="mb-6">Thank you for completing the open-ended questions quiz.</p>
        <Button 
          variant="outline" 
          onClick={() => {
            setCompleted(false);
            // Reset responses for retaking
            setResponses({});
          }}
        >
          Retake Quiz
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg mb-4">
        <h3 className="font-medium text-lg mb-2">Open-ended Questions Quiz</h3>
        <p className="text-gray-600 dark:text-gray-300">
          Answer the following questions about your interests, skills, and experiences. 
          These questions are designed to help you reflect on your academic and career goals.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q, index) => (
            <Card key={index} className={`p-4 ${isCurrentlyDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge>{q.criterion}</Badge>
                  {q.major && q.major !== 'General' && (
                    <Badge variant="outline">{q.major}</Badge>
                  )}
                </div>
                <p className="text-md font-medium">{q.question}</p>
                
                <Textarea
                  className={`mt-2 ${isCurrentlyDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                  placeholder="Type your answer here..."
                  rows={4}
                  value={responses[q.id || ''] || ''}
                  onChange={(e) => handleResponseChange(q.id || '', e.target.value)}
                />
              </div>
            </Card>
          ))}
          
          <div className="flex justify-end mt-4">
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
          </div>
        </div>
      )}
    </div>
  );
};
