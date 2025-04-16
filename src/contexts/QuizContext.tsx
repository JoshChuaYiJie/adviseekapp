
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase, TableName, Module, QuizQuestion, Recommendation, UserFeedback } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define types for our context
interface QuizContextType {
  currentStep: number;
  responses: Record<number, string | string[]>;
  questions: QuizQuestion[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  recommendations: {
    module_id: number;
    reason: string;
    module?: Module;
  }[];
  userFeedback: Record<number, number>;
  modules: Module[];
  finalSelections: {module: Module, reason: string}[];
  setCurrentStep: (step: number) => void;
  handleResponse: (questionId: number, response: string | string[]) => void;
  submitResponses: () => Promise<void>;
  rateModule: (moduleId: number, rating: number) => Promise<void>;
  refineRecommendations: () => Promise<void>;
  getFinalSelections: () => Promise<{module: Module, reason: string}[]>;
  resetQuiz: () => void;
}

// Create the context with default values
const QuizContext = createContext<QuizContextType>({
  currentStep: 1,
  responses: {},
  questions: [],
  isLoading: true,
  isSubmitting: false,
  error: null,
  recommendations: [],
  userFeedback: {},
  modules: [],
  finalSelections: [],
  setCurrentStep: () => {},
  handleResponse: () => {},
  submitResponses: async () => {},
  rateModule: async () => {},
  refineRecommendations: async () => {},
  getFinalSelections: async () => [],
  resetQuiz: () => {},
});

// Hook to use the Quiz context
export const useQuiz = () => useContext(QuizContext);

// Use type assertion to get around the type issues with Supabase client
const fromTable = (table: TableName) => {
  return supabase.from(table);
};

// Provider component
export const QuizProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { toast } = useToast();
  
  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [responses, setResponses] = useState<Record<number, string | string[]>>({});
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [recommendations, setRecommendations] = useState<{
    module_id: number;
    reason: string;
    module?: Module;
  }[]>([]);
  const [userFeedback, setUserFeedback] = useState<Record<number, number>>({});
  const [finalSelections, setFinalSelections] = useState<{module: Module, reason: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get current user ID or null if not logged in
  const getUserId = async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id || null;
  };

  // Load quiz questions on mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setIsLoading(true);
        
        // First try to fetch questions from Supabase
        const { data: existingQuestions, error } = await fromTable('quiz_questions')
          .select()
          .order('id');
        
        if (error) {
          console.error("Error loading questions:", error);
          throw new Error(`Failed to load questions: ${error.message}`);
        }
        
        // If no questions exist, we need to insert our predefined questions
        if (!existingQuestions || existingQuestions.length === 0) {
          // Insert predefined questions
          await insertPredefinedQuestions();
          
          // Fetch the newly inserted questions
          const { data: newQuestions, error: newError } = await fromTable('quiz_questions')
            .select()
            .order('id');
            
          if (newError) {
            throw new Error(`Failed to load new questions: ${newError.message}`);
          }
          
          setQuestions(newQuestions as QuizQuestion[] || []);
        } else {
          setQuestions(existingQuestions as QuizQuestion[]);
        }
        
        // Load modules
        await loadModules();
      } catch (err) {
        console.error("Error in loadQuestions:", err);
        setError(err instanceof Error ? err.message : "Failed to load questions");
        toast({
          title: "Error",
          description: "Failed to load quiz questions. Please try refreshing.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadQuestions();
  }, []);
  
  // Handle user responses
  const handleResponse = (questionId: number, response: string | string[]) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: response
    }));
  };
  
  // Submit responses
  const submitResponses = async () => {
    try {
      setIsSubmitting(true);
      
      // Get user ID
      const userId = await getUserId();
      if (!userId) {
        throw new Error("You must be logged in to submit responses");
      }
      
      // Format responses for database
      const formattedResponses = Object.entries(responses).map(([questionId, response]) => {
        const isArray = Array.isArray(response);
        return {
          user_id: userId,
          question_id: parseInt(questionId),
          response: isArray ? null : response as string,
          response_array: isArray ? JSON.stringify(response) : null
        };
      });
      
      // Save responses to database
      const { error: responseError } = await fromTable('user_responses')
        .upsert(formattedResponses, { onConflict: 'user_id,question_id' });
      
      if (responseError) {
        throw new Error(`Failed to save responses: ${responseError.message}`);
      }
      
      // Generate recommendations
      await generateRecommendations(userId);
    } catch (err) {
      console.error("Error submitting responses:", err);
      setError(err instanceof Error ? err.message : "Failed to submit responses");
      toast({
        title: "Error",
        description: "Failed to submit your responses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Generate recommendations
  const generateRecommendations = async (userId: string) => {
    try {
      // This is where you would call your AI service
      // For now, we'll just pick 30 random modules
      if (modules.length === 0) {
        throw new Error("No modules available");
      }
      
      // Get 30 random modules or all if less than 30
      const randomModules = [...modules]
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(30, modules.length));
      
      // Create mock recommendations
      const mockRecommendations = randomModules.map(module => ({
        user_id: userId,
        module_id: module.id,
        reason: `This ${module.university} module matches your interests and academic requirements.`
      }));
      
      // Save recommendations to database
      const { error: recError } = await fromTable('recommendations')
        .insert(mockRecommendations);
      
      if (recError) {
        throw new Error(`Failed to save recommendations: ${recError.message}`);
      }
      
      // Load recommendations with module details
      await loadRecommendations(userId);
    } catch (err) {
      console.error("Error generating recommendations:", err);
      setError(err instanceof Error ? err.message : "Failed to generate recommendations");
      throw err;
    }
  };
  
  // Rate a module
  const rateModule = async (moduleId: number, rating: number) => {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error("You must be logged in to rate modules");
      }
      
      // Update local state immediately for better UX
      setUserFeedback(prev => ({
        ...prev,
        [moduleId]: rating
      }));
      
      // Save rating to database
      const { error } = await fromTable('user_feedback')
        .upsert({
          user_id: userId,
          module_id: moduleId,
          rating: rating
        }, { onConflict: 'user_id,module_id' });
      
      if (error) {
        // Revert state change if there was an error
        setUserFeedback(prev => {
          const newState = { ...prev };
          delete newState[moduleId];
          return newState;
        });
        throw new Error(`Failed to save rating: ${error.message}`);
      }
    } catch (err) {
      console.error("Error rating module:", err);
      toast({
        title: "Error",
        description: "Failed to save your rating. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Load user feedback (ratings)
  const loadUserFeedback = async (userId: string) => {
    try {
      const { data, error } = await fromTable('user_feedback')
        .select('module_id, rating')
        .eq('user_id', userId);
      
      if (error) {
        throw new Error(`Failed to load ratings: ${error.message}`);
      }
      
      // Convert array to object mapping moduleId -> rating
      const feedbackObj: Record<number, number> = {};
      if (data) {
        // Type assertion to fix the error with UserFeedback[]
        const feedbackData = data as unknown as { module_id: number; rating: number }[];
        feedbackData.forEach(item => {
          feedbackObj[item.module_id] = item.rating;
        });
      }
      
      setUserFeedback(feedbackObj);
    } catch (err) {
      console.error("Error loading user feedback:", err);
      // Non-fatal error, don't update error state
    }
  };
  
  // Load recommendations
  const loadRecommendations = async (userId: string) => {
    try {
      const { data, error } = await fromTable('recommendations')
        .select(`
          id,
          user_id,
          module_id,
          reason,
          created_at,
          modules:module_id(id, university, course_code, title, aus_cus, semester, description)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Failed to load recommendations: ${error.message}`);
      }
      
      // Transform data to match our format
      const formattedRecs = data ? (data as any[]).map((rec: any) => ({
        module_id: rec.module_id,
        reason: rec.reason,
        module: rec.modules as Module
      })) : [];
      
      setRecommendations(formattedRecs);
      
      // Also load user feedback (ratings)
      await loadUserFeedback(userId);
    } catch (err) {
      console.error("Error loading recommendations:", err);
      setError(err instanceof Error ? err.message : "Failed to load recommendations");
    }
  };
  
  // Refine recommendations based on user feedback
  const refineRecommendations = async () => {
    try {
      setIsLoading(true);
      
      const userId = await getUserId();
      if (!userId) {
        throw new Error("You must be logged in to refine recommendations");
      }
      
      // In a real implementation, this would send the ratings to your AI service
      // For now, we'll just pick 30 random modules that might include some higher-rated ones
      
      // Get modules that haven't been recommended yet
      const alreadyRecommendedIds = recommendations.map(rec => rec.module_id);
      const unusedModules = modules.filter(mod => !alreadyRecommendedIds.includes(mod.id));
      
      // Pick some random modules (or all if less than 20)
      const randomCount = Math.min(20, unusedModules.length);
      const randomModules = unusedModules
        .sort(() => 0.5 - Math.random())
        .slice(0, randomCount);
      
      // Create new recommendations
      const newRecommendations = randomModules.map(module => ({
        user_id: userId,
        module_id: module.id,
        reason: `This refined recommendation is based on your module ratings and preferences.`
      }));
      
      // Save recommendations to database
      const { error: recError } = await fromTable('recommendations')
        .insert(newRecommendations);
      
      if (recError) {
        throw new Error(`Failed to save refined recommendations: ${recError.message}`);
      }
      
      // Load the updated recommendations
      await loadRecommendations(userId);
      
      toast({
        title: "Recommendations Refined",
        description: "Your recommendations have been updated based on your ratings.",
      });
    } catch (err) {
      console.error("Error refining recommendations:", err);
      setError(err instanceof Error ? err.message : "Failed to refine recommendations");
      toast({
        title: "Error",
        description: "Failed to refine recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get final course selections
  const getFinalSelections = async () => {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error("You must be logged in to get course selections");
      }
      
      // Select modules with highest ratings
      // In a real implementation, this would consider more factors
      
      // Get modules with ratings
      const ratedModuleIds = Object.keys(userFeedback).map(Number);
      const ratedModules = recommendations.filter(rec => 
        ratedModuleIds.includes(rec.module_id) && userFeedback[rec.module_id] >= 7
      );
      
      // Sort by rating (highest first)
      ratedModules.sort((a, b) => 
        (userFeedback[b.module_id] || 0) - (userFeedback[a.module_id] || 0)
      );
      
      // Take top 5-10 modules
      const selections = ratedModules.slice(0, Math.min(10, ratedModules.length));
      
      if (selections.length < 5) {
        toast({
          title: "Not Enough Ratings",
          description: "Please rate more modules highly (7+) to get course selections.",
        });
        return [];
      }
      
      // Save selections to database
      const selectionsForDb = selections.map(rec => ({
        user_id: userId,
        module_id: rec.module_id
      }));
      
      // Clear existing selections first
      await fromTable('user_selections')
        .delete()
        .eq('user_id', userId);
      
      // Insert new selections
      const { error } = await fromTable('user_selections')
        .insert(selectionsForDb);
      
      if (error) {
        throw new Error(`Failed to save selections: ${error.message}`);
      }
      
      // Format for return
      const formattedSelections = selections.map(rec => ({
        module: rec.module!,
        reason: rec.reason
      }));
      
      setFinalSelections(formattedSelections);
      return formattedSelections;
    } catch (err) {
      console.error("Error getting final selections:", err);
      toast({
        title: "Error",
        description: "Failed to generate course selections. Please try again.",
        variant: "destructive",
      });
      return [];
    }
  };
  
  // Reset quiz
  const resetQuiz = () => {
    setCurrentStep(1);
    setResponses({});
    setRecommendations([]);
    setUserFeedback({});
    setFinalSelections([]);
    setError(null);
  };
  
  // Load modules from JSON files and save to database
  const loadModules = async () => {
    try {
      // First check if modules already exist in database
      const { data: existingModules, error: checkError } = await fromTable('modules')
        .select('id')
        .limit(1);
      
      if (checkError) {
        throw new Error(`Failed to check modules: ${checkError.message}`);
      }
      
      // If modules exist, just load them
      if (existingModules && existingModules.length > 0) {
        const { data, error } = await fromTable('modules')
          .select();
          
        if (error) {
          throw new Error(`Failed to load modules: ${error.message}`);
        }
        
        setModules(data as Module[] || []);
        return;
      }
      
      // Otherwise load from JSON files and insert into database
      const [smuData] = await Promise.all([
        fetch('/school-data/SMU MODs AY 2024-2025 Term2.json').then(res => res.json())
      ]);
      
      // Parse SMU data
      const smuModules = smuData.map((mod: any, index: number) => {
        // Extract course code and title
        const courseCode = mod.textsm.split(' | ')[0];
        const title = mod.Title;
        
        // Extract AU/CU
        const auMatch = mod.textsm.match(/(\d+) CU/);
        const aus_cus = auMatch ? parseInt(auMatch[1]) : 1;
        
        // Extract semester/term
        const semester = "Term 2";
        
        return {
          id: index + 1,
          university: "SMU" as const,
          course_code: courseCode,
          title: title,
          aus_cus: aus_cus,
          semester: semester,
          description: `This course covers topics relevant to ${title}.`
        };
      });
      
      // Insert modules into database
      const { error: insertError } = await fromTable('modules')
        .insert(smuModules);
      
      if (insertError) {
        throw new Error(`Failed to save modules: ${insertError.message}`);
      }
      
      // Load the saved modules
      const { data: savedModules, error: loadError } = await fromTable('modules')
        .select();
        
      if (loadError) {
        throw new Error(`Failed to load saved modules: ${loadError.message}`);
      }
      
      setModules(savedModules as Module[] || []);
    } catch (err) {
      console.error("Error loading modules:", err);
      setError(err instanceof Error ? err.message : "Failed to load modules");
    }
  };
  
  // Insert predefined quiz questions
  const insertPredefinedQuestions = async () => {
    // Define the 25 questions as specified in the requirements
    const predefinedQuestions = [
      // Interest section
      {
        section: "Interest",
        question_text: "Which of the following areas are you most interested in?",
        question_type: "multi-select",
        options: ["Computer Science", "Engineering", "Business and Management", "Social Sciences", "Natural Sciences", "Arts and Humanities", "Law", "Medicine and Health"]
      },
      {
        section: "Interest",
        question_text: "If you selected none of the above or have specific topics in mind, please specify.",
        question_type: "text",
        options: null
      },
      // ... 23 more questions as per requirements
      {
        section: "Feasibility",
        question_text: "How many hours per week are you willing to dedicate to studying?",
        question_type: "single-select",
        options: ["Less than 5 hours", "5-10 hours", "10-15 hours", "More than 15 hours"]
      },
      {
        section: "Feasibility",
        question_text: "What is your preferred learning environment?",
        question_type: "single-select",
        options: ["Online", "In-person", "Hybrid"]
      },
      {
        section: "Feasibility",
        question_text: "Do you have any prior experience in the field you are interested in?",
        question_type: "single-select",
        options: ["Yes", "No"]
      },
      {
        section: "Feasibility",
        question_text: "What is your current GPA?",
        question_type: "single-select",
        options: ["Below 3.0", "3.0-3.5", "3.5-4.0", "Above 4.0"]
      },
      {
        section: "Feasibility",
        question_text: "Are you currently working?",
        question_type: "single-select",
        options: ["Yes, full-time", "Yes, part-time", "No"]
      },
      // Career Goals section
      {
        section: "Career Goals",
        question_text: "What are your primary career goals?",
        question_type: "multi-select",
        options: ["Start my own business", "Work in a large corporation", "Work in a small company", "Work in a non-profit organization", "Pursue further education", "Other"]
      },
      {
        section: "Career Goals",
        question_text: "Which industries are you most interested in?",
        question_type: "multi-select",
        options: ["Technology", "Finance", "Healthcare", "Education", "Government", "Arts and Entertainment", "Other"]
      },
      {
        section: "Career Goals",
        question_text: "What kind of salary are you expecting after graduation?",
        question_type: "single-select",
        options: ["Less than $50,000", "$50,000 - $75,000", "$75,000 - $100,000", "More than $100,000"]
      },
      {
        section: "Career Goals",
        question_text: "What is your preferred work-life balance?",
        question_type: "single-select",
        options: ["Work-life balance is very important", "I am willing to sacrifice work-life balance for career advancement", "I am not sure"]
      },
      {
        section: "Career Goals",
        question_text: "What is your preferred job location?",
        question_type: "single-select",
        options: ["Singapore", "Overseas", "Remote"]
      },
      // Learning Style section
      {
        section: "Learning Style",
        question_text: "What is your preferred learning style?",
        question_type: "single-select",
        options: ["Visual", "Auditory", "Kinesthetic", "Reading/Writing"]
      },
      {
        section: "Learning Style",
        question_text: "Do you prefer to work in groups or individually?",
        question_type: "single-select",
        options: ["Groups", "Individually"]
      },
      {
        section: "Learning Style",
        question_text: "Do you prefer to learn through lectures or hands-on activities?",
        question_type: "single-select",
        options: ["Lectures", "Hands-on activities"]
      },
      {
        section: "Learning Style",
        question_text: "Do you prefer to learn through theory or practice?",
        question_type: "single-select",
        options: ["Theory", "Practice"]
      },
      {
        section: "Learning Style",
        question_text: "Do you prefer to learn through structured or unstructured environments?",
        question_type: "single-select",
        options: ["Structured", "Unstructured"]
      },
      // Additional questions to reach 25
      {
        section: "Interest",
        question_text: "Are you interested in courses that involve a lot of writing?",
        question_type: "single-select",
        options: ["Yes", "No"]
      },
      {
        section: "Interest",
        question_text: "Are you interested in courses that involve a lot of math?",
        question_type: "single-select",
        options: ["Yes", "No"]
      },
      {
        section: "Feasibility",
        question_text: "Are you willing to take courses that are outside of your major?",
        question_type: "single-select",
        options: ["Yes", "No"]
      },
      {
        section: "Feasibility",
        question_text: "Are you willing to take courses that are more difficult than your current level?",
        question_type: "single-select",
        options: ["Yes", "No"]
      },
      {
        section: "Career Goals",
        question_text: "Are you interested in courses that will help you develop your leadership skills?",
        question_type: "single-select",
        options: ["Yes", "No"]
      },
      {
        section: "Career Goals",
        question_text: "Are you interested in courses that will help you develop your communication skills?",
        question_type: "single-select",
        options: ["Yes", "No"]
      },
      {
        section: "Learning Style",
        question_text: "Do you prefer to learn through visual aids such as videos and diagrams?",
        question_type: "single-select",
        options: ["Yes", "No"]
      }
    ];
    
    try {
      const { error } = await fromTable('quiz_questions')
        .insert(predefinedQuestions);
      
      if (error) {
        throw new Error(`Failed to insert predefined questions: ${error.message}`);
      }
    } catch (err) {
      console.error("Error inserting predefined questions:", err);
      throw err;
    }
  };
  
  // Memoize the context value to prevent unnecessary rerenders
  const contextValue = useMemo(() => ({
    currentStep,
    responses,
    questions,
    isLoading,
    isSubmitting,
    error,
    recommendations,
    userFeedback,
    modules,
    finalSelections,
    setCurrentStep,
    handleResponse,
    submitResponses,
    rateModule,
    refineRecommendations,
    getFinalSelections,
    resetQuiz,
  }), [
    currentStep, 
    responses, 
    questions, 
    isLoading, 
    isSubmitting, 
    error,
    recommendations,
    userFeedback,
    modules,
    finalSelections
  ]);
  
  return (
    <QuizContext.Provider value={contextValue}>
      {children}
    </QuizContext.Provider>
  );
};
