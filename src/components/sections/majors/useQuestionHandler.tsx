import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OpenEndedQuestion } from './types';
import { formatMajorForFile } from './MajorUtils';
import { useRecommendationContext } from '@/contexts/RecommendationContext';

export const useQuestionHandler = ({ userId }: { userId: string | null }) => {
  const [questions, setQuestions] = useState<OpenEndedQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, { response: string; skipped: boolean }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [recommendedMajors, setRecommendedMajors] = useState<string[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const { toast } = useToast();
  const { majorRecommendations } = useRecommendationContext();

  // Load questions for a specific major
  useEffect(() => {
    const loadSavedResumes = async () => {
    };
    
  }, [toast]);

  // Prepare questions for recommended majors - updated to use context
  const prepareQuestionsForRecommendedMajors = async (providedMajors?: string[]) => {
    setLoadingRecommendations(true);
    setLoadingQuestions(true);
    
    try {
      // First check if we have majors from context
      let majorsToUse: string[] = [];
      
      if (majorRecommendations) {
        // Get combined list of all recommended majors from context
        const allContextMajors = [
          ...(majorRecommendations.exactMatches || []),
          ...(majorRecommendations.permutationMatches || []),
          ...(majorRecommendations.riasecMatches || []),
          ...(majorRecommendations.workValueMatches || [])
        ];
        
        // Use unique majors from context
        majorsToUse = [...new Set(allContextMajors)];
        console.log("Using majors from context:", majorsToUse);
      }
      
      // If no majors from context, use provided majors or default set
      if (majorsToUse.length === 0) {
        majorsToUse = providedMajors || ['Computer Science', 'Data Science', 'Business Analytics'];
        console.log("Using provided or default majors:", majorsToUse); 
      }
      
      if (providedMajors && providedMajors.length > 0) {
        setRecommendedMajors(providedMajors);
      } else {
        setRecommendedMajors(majorsToUse);
      }

      // Select up to 5 majors
      const selectedMajors = majorsToUse.slice(0, 5);
      
      // For each major, try to load questions
      const allQuestions: OpenEndedQuestion[] = [];
      
      for (const major of selectedMajors) {
        try {
          // Format major for file lookup - handle "Major at School" format
          const [majorName, schoolName] = major.split(' at ');
          const formattedMajor = formatMajorForFile(majorName, schoolName || '');
          
          // Try to load questions with school-specific formatting
          const schools = schoolName ? [schoolName] : ['NTU', 'NUS', 'SMU'];
          
          for (const school of schools) {
            try {
              const response = await fetch(`/quiz_refer/Open_ended_quiz_questions/${formattedMajor}_${school}.json`);
              
              if (response.ok) {
                const loadedQuestions = await response.json();
                
                // Add major name to each question for display
                const questionsWithMajor = loadedQuestions.map((q: any) => ({
                  ...q,
                  majorName: majorName
                }));
                
                // Add a few randomly selected questions
                const randomQuestions = questionsWithMajor
                  .sort(() => 0.5 - Math.random())
                  .slice(0, 3);
                  
                allQuestions.push(...randomQuestions);
                break; // Found questions for this major, move to next
              }
            } catch (error) {
              console.error(`Error loading questions for ${majorName} at ${school}:`, error);
              // Continue to next school
            }
          }
        } catch (error) {
          console.error(`Error processing major ${major}:`, error);
        }
      }
      
      // Shuffle questions for variety
      const shuffledQuestions = allQuestions.sort(() => 0.5 - Math.random());
      
      console.log(`Loaded ${shuffledQuestions.length} questions from recommended majors`);
      setQuestions(shuffledQuestions);
      
    } catch (error) {
      console.error("Error preparing questions for recommended majors:", error);
      toast({
        title: "Error",
        description: "Failed to prepare quiz questions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingRecommendations(false);
      setLoadingQuestions(false);
    }
  };

  const loadQuestions = async (majorName: string) => {
    setLoadingQuestions(true);
    try {
      // Initialize the open-ended questions for the major
      const formattedMajor = majorName.replace(/ /g, '_').replace(/[\/&,]/g, '_');
      const schools = ['NTU', 'NUS', 'SMU'];
      
      // Try each school suffix until we find one that works
      let allQuestions: OpenEndedQuestion[] = [];
      let foundQuestions = false;
      
      for (const school of schools) {
        try {
          const response = await fetch(`/quiz_refer/Open_ended_quiz_questions/${formattedMajor}_${school}.json`);
          
          if (response.ok) {
            const questions = await response.json();
            console.log(`Found ${questions.length} questions for ${majorName} at ${school}`);
            allQuestions = questions;
            foundQuestions = true;
            break;
          }
        } catch (error) {
          console.error(`Error loading questions for ${majorName} at ${school}:`, error);
          // Continue to next school
        }
      }
      
      if (!foundQuestions) {
        console.log(`No questions found for ${majorName}`);
        setQuestions([]);
        setLoadingQuestions(false);
        return;
      }

      setQuestions(allQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Submit responses to the database
  const handleSubmitResponses = async (majorName: string | null) => {
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
      // Prepare responses using the updated schema
      const responsesToSave = Object.entries(answeredQuestions)
        .filter(([_, response]) => !response.skipped)
        .map(([questionId, response]) => {
          const questionInfo = questions.find(q => q.id === questionId);
          
          const dataToSave = {
            user_id: userId,
            question_id: questionId,
            question: questionInfo?.question || '',
            response: response.response,
            skipped: response.skipped,
            major: questionInfo?.majorName || majorName || ''
          };
          
          console.log(`Preparing to save response for question ${questionId}:`, dataToSave);
          return dataToSave;
        });
      
      if (responsesToSave.length > 0) {
        console.log(`Submitting ${responsesToSave.length} responses to Supabase:`, responsesToSave);
        
        // Save valid responses to database
        const { error, data } = await supabase
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
          console.log("Responses saved successfully:", data);
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
          
          // Clear cached responses after successful submission
          try {
            localStorage.removeItem('cachedOpenEndedResponses');
            console.log("Cleared cached open-ended responses after successful submission");
          } catch (e) {
            console.error("Error clearing cached responses:", e);
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
      console.error("Error in handleSubmitResponses:", error);
      toast({
        title: "Something went wrong",
        description: "Failed to save responses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
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
  };
};
