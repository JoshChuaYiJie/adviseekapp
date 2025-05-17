
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OpenEndedQuestion } from './types';
import { formatMajorForFile } from './MajorUtils';

export const useQuestionHandler = ({ userId }: { userId: string | null }) => {
  const [questions, setQuestions] = useState<OpenEndedQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, { response: string; skipped: boolean }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [recommendedMajors, setRecommendedMajors] = useState<string[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const { toast } = useToast();

  // Load questions for a specific major
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

  // Prepare questions for recommended majors - updated to accept provided majors list
  const prepareQuestionsForRecommendedMajors = async (providedMajors?: string[]) => {
    setLoadingRecommendations(true);
    setLoadingQuestions(true);
    
    try {
      // Use provided majors if available, otherwise use default set
      let majorsToUse = providedMajors || ['Computer Science', 'Data Science', 'Business Analytics'];
      console.log("Preparing questions for majors:", majorsToUse);
      
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
      // Filter out empty responses and skipped questions
      const responsesToSave = Object.entries(answeredQuestions)
        .filter(([_, response]) => response.response.trim() !== '' && !response.skipped)
        .map(([questionId, response]) => {
          const questionInfo = questions.find(q => q.id === questionId);
          
          return {
            user_id: userId,
            question: questionInfo?.question || '',
            response: response.response,
            major: questionInfo?.majorName || majorName || ''
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
