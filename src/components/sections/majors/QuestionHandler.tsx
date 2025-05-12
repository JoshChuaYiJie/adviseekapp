
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OpenEndedQuestion, OpenEndedResponse } from './types';
import { formatMajorForFile } from './MajorUtils';
import { 
  getMatchingMajors, 
  mapRiasecToCode, 
  mapWorkValueToCode, 
  formCode 
} from '@/utils/recommendation';
import { processRiasecData } from '@/components/sections/RiasecChart';
import { processWorkValuesData } from '@/components/sections/WorkValuesChart';

interface QuestionHandlerProps {
  userId: string | null;
}

export const useQuestionHandler = ({ userId }: QuestionHandlerProps) => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<OpenEndedQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, { response: string; skipped: boolean }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [recommendedMajors, setRecommendedMajors] = useState<string[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Load recommended majors based on user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!userId) return;
      
      try {
        setLoadingRecommendations(true);
        
        // Get RIASEC data from chart processing function
        const riasecChartData = await processRiasecData(userId);
        
        // Get Work Values data from chart processing function
        const workValuesChartData = await processWorkValuesData(userId);
        
        let generatedRiasecCode = "";
        let generatedWorkValueCode = "";
        
        // Generate RIASEC code if data exists
        if (riasecChartData && riasecChartData.length > 0) {
          // Format data for code generation
          const formattedRiasecData = riasecChartData.map(item => ({
            component: item.name,
            average: 0,
            score: item.value
          }));
          
          generatedRiasecCode = formCode(formattedRiasecData, mapRiasecToCode);
        } else {
          // Fallback if no data
          generatedRiasecCode = "RSI";
        }
        
        // Generate Work Values code if data exists
        if (workValuesChartData && workValuesChartData.length > 0) {
          // Format data for code generation
          const formattedWorkValuesData = workValuesChartData.map(item => ({
            component: item.name,
            average: 0,
            score: item.value
          }));
          
          generatedWorkValueCode = formCode(formattedWorkValuesData, mapWorkValueToCode);
        } else {
          // Fallback if no data
          generatedWorkValueCode = "ARS";
        }
        
        // Get recommended majors based on profile codes
        if (generatedRiasecCode && generatedWorkValueCode) {
          const majorRecommendations = await getMatchingMajors(generatedRiasecCode, generatedWorkValueCode);
          
          // Combine all recommended majors
          const allRecommendedMajors = [
            ...majorRecommendations.exactMatches,
            ...majorRecommendations.riasecMatches,
            ...majorRecommendations.workValueMatches
          ];
          
          // Remove duplicates
          const uniqueRecommendedMajors = [...new Set(allRecommendedMajors)];
          
          console.log("Recommended majors for questions:", uniqueRecommendedMajors);
          setRecommendedMajors(uniqueRecommendedMajors);
        }
      } catch (error) {
        console.error("Error loading user profile for questions:", error);
      } finally {
        setLoadingRecommendations(false);
      }
    };
    
    loadUserProfile();
  }, [userId]);

  const loadQuestions = async (majorName: string) => {
    try {
      setLoadingQuestions(true);
      setSelectedMajor(majorName);
      const [major, school] = majorName.split(' at ');
      const formattedMajor = formatMajorForFile(major, school || '');
      
      // Fetch questions from the JSON file
      const response = await fetch(`/quiz_refer/Open_ended_quiz_questions/${formattedMajor}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load questions for ${majorName}`);
      }
      
      const allQuestions = await response.json() as OpenEndedQuestion[];
      console.log(`Loaded ${allQuestions.length} questions for ${majorName}`);
      
      // Categorize questions by criterion
      const interestQuestions = allQuestions.filter(q => q.criterion.toLowerCase().includes('interest'));
      const skillQuestions = allQuestions.filter(q => q.criterion.toLowerCase().includes('skill'));
      const experienceQuestions = allQuestions.filter(q => 
        q.criterion.toLowerCase().includes('experience') || 
        q.criterion.toLowerCase().includes('background')
      );
      
      console.log(`Found: ${interestQuestions.length} interest questions, ${skillQuestions.length} skill questions, ${experienceQuestions.length} experience questions`);
      
      // Select one random question from each category
      const selectedQuestions: OpenEndedQuestion[] = [];
      
      // Helper function to get a random question from a category
      const getRandomQuestion = (questions: OpenEndedQuestion[]) => {
        if (questions.length === 0) return null;
        return questions[Math.floor(Math.random() * questions.length)];
      };
      
      // Get one question from each category
      const interestQuestion = getRandomQuestion(interestQuestions);
      const skillQuestion = getRandomQuestion(skillQuestions);
      const experienceQuestion = getRandomQuestion(experienceQuestions);
      
      // Add available questions to the selected questions array
      if (interestQuestion) selectedQuestions.push({...interestQuestion, category: 'interests', majorName: majorName});
      if (skillQuestion) selectedQuestions.push({...skillQuestion, category: 'skills', majorName: majorName});
      if (experienceQuestion) selectedQuestions.push({...experienceQuestion, category: 'experience', majorName: majorName});
      
      // If we don't have 3 questions, fill from other categories or general questions
      if (selectedQuestions.length < 3) {
        const remainingQuestions = allQuestions.filter(q => 
          !selectedQuestions.some(sq => sq.id === q.id)
        );
        
        while (selectedQuestions.length < 3 && remainingQuestions.length > 0) {
          const randomIndex = Math.floor(Math.random() * remainingQuestions.length);
          const question = remainingQuestions.splice(randomIndex, 1)[0];
          selectedQuestions.push({
            ...question, 
            category: 'general',
            majorName: majorName
          });
        }
      }
      
      console.log(`Selected ${selectedQuestions.length} questions for the quiz`);
      setQuestions(selectedQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: "Error",
        description: "Failed to load questions for this major.",
        variant: "destructive"
      });
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Function to prepare questions for recommended majors
  const prepareQuestionsForRecommendedMajors = async () => {
    try {
      setLoadingQuestions(true);
      
      if (recommendedMajors.length === 0) {
        console.log("No recommended majors found for questions");
        return;
      }
      
      // Get up to 5 recommended majors
      const majorsToUse = recommendedMajors.slice(0, 5);
      console.log(`Preparing questions for ${majorsToUse.length} recommended majors:`, majorsToUse);
      
      const allPreparedQuestions: OpenEndedQuestion[] = [];
      
      // For each major, get one question from each category (interest, skill, experience)
      for (const majorName of majorsToUse) {
        try {
          const [major, school] = majorName.split(' at ');
          const formattedMajor = formatMajorForFile(major, school || '');
          
          // Fetch questions from the JSON file
          const response = await fetch(`/quiz_refer/Open_ended_quiz_questions/${formattedMajor}.json`);
          if (!response.ok) {
            console.error(`Failed to load questions for ${majorName}`);
            continue;
          }
          
          const majorQuestions = await response.json() as OpenEndedQuestion[];
          
          // Categorize questions by criterion
          const interestQuestions = majorQuestions.filter(q => q.criterion.toLowerCase().includes('interest'));
          const skillQuestions = majorQuestions.filter(q => q.criterion.toLowerCase().includes('skill'));
          const experienceQuestions = majorQuestions.filter(q => 
            q.criterion.toLowerCase().includes('experience') || 
            q.criterion.toLowerCase().includes('background')
          );
          
          // Helper function to get a random question from a category
          const getRandomQuestion = (questions: OpenEndedQuestion[]) => {
            if (questions.length === 0) return null;
            return questions[Math.floor(Math.random() * questions.length)];
          };
          
          // Get one question from each category for this major
          const interestQuestion = getRandomQuestion(interestQuestions);
          const skillQuestion = getRandomQuestion(skillQuestions);
          const experienceQuestion = getRandomQuestion(experienceQuestions);
          
          // Add metadata to each question
          if (interestQuestion) {
            allPreparedQuestions.push({
              ...interestQuestion, 
              category: 'interests',
              majorName: majorName
            });
          }
          
          if (skillQuestion) {
            allPreparedQuestions.push({
              ...skillQuestion, 
              category: 'skills',
              majorName: majorName
            });
          }
          
          if (experienceQuestion) {
            allPreparedQuestions.push({
              ...experienceQuestion, 
              category: 'experience',
              majorName: majorName
            });
          }
        } catch (error) {
          console.error(`Error preparing questions for ${majorName}:`, error);
        }
      }
      
      console.log(`Prepared ${allPreparedQuestions.length} questions for recommended majors`);
      setQuestions(allPreparedQuestions);
    } catch (error) {
      console.error('Error preparing questions for recommended majors:', error);
      toast({
        title: "Error",
        description: "Failed to load questions for recommended majors.",
        variant: "destructive"
      });
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSubmitResponses = async (selectedMajor: string | null) => {
    if (!selectedMajor && questions.length === 0) {
      toast({
        title: "No Questions Available",
        description: "Please select a major or load questions before submitting.",
        variant: "destructive"
      });
      return;
    }
    
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
      // Prepare responses for database - use the new open_ended_responses table
      const responsesToSubmit = Object.entries(answeredQuestions).map(([questionId, responseData]) => {
        const questionInfo = questions.find(q => q.id === questionId);
        
        return {
          user_id: userId,
          question_id: questionId,
          response: responseData.response,
          skipped: responseData.skipped,
          major: questionInfo?.majorName || selectedMajor || '',
          question: questionInfo?.question || ''
        };
      });
      
      // Upload responses to Supabase open_ended_responses table
      const { error } = await supabase
        .from('open_ended_responses')
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

  return {
    questions,
    loadingQuestions,
    answeredQuestions,
    setAnsweredQuestions,
    submitting,
    completed,
    loadQuestions,
    handleSubmitResponses,
    selectedMajor,
    recommendedMajors,
    loadingRecommendations,
    prepareQuestionsForRecommendedMajors
  };
};
