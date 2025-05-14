
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { loadUserFeedback, rateModuleFunction } from './recommendationUtils';

export const useFeedbackManagement = () => {
  const [userFeedback, setUserFeedback] = useState<Record<number, number>>({});
  const { toast } = useToast();

  // Load user feedback (ratings)
  const loadFeedback = async (userId: string) => {
    try {
      const feedback = await loadUserFeedback(userId);
      setUserFeedback(feedback);
      return feedback;
    } catch (error) {
      console.error("Error loading user feedback:", error);
      return {};
    }
  };

  // Rate a module
  const rateModule = async (moduleId: number, rating: number) => {
    try {
      // Update local state immediately for better UX
      setUserFeedback(prev => ({
        ...prev,
        [moduleId]: rating
      }));
      
      // Save rating to database
      const success = await rateModuleFunction(moduleId, rating);
      
      if (!success) {
        throw new Error("Failed to save rating");
      }
    } catch (err) {
      console.error("Error rating module:", err);
      
      // Revert state change if there was an error
      setUserFeedback(prev => {
        const newState = { ...prev };
        delete newState[moduleId];
        return newState;
      });
      
      toast({
        title: "Error",
        description: "Failed to save your rating. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    userFeedback,
    setUserFeedback,
    loadFeedback,
    rateModule
  };
};
