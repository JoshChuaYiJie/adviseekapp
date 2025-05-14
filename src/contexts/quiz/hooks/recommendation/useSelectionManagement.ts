
import { useState } from 'react';
import { Module } from '@/integrations/supabase/client';
import { ModuleSelection, Recommendation } from '../../types/recommendationTypes';
import { useToast } from '@/hooks/use-toast';
import { getUserId } from '../../utils/databaseHelpers';
import { getFinalSelectionsFunction } from './recommendationUtils';

export const useSelectionManagement = () => {
  const [finalSelections, setFinalSelections] = useState<ModuleSelection[]>([]);
  const { toast } = useToast();

  // Get final course selections
  const getFinalSelections = async (
    recommendations: Recommendation[],
    userFeedback: Record<number, number>
  ) => {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error("You must be logged in to get course selections");
      }
      
      const [modules, selections] = await getFinalSelectionsFunction(userId, recommendations, userFeedback);
      
      if (selections.length < 5) {
        toast({
          title: "Not Enough Ratings",
          description: "Please rate more modules highly (7+) to get course selections.",
        });
        return [];
      }
      
      setFinalSelections(selections);
      return modules;
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

  return {
    finalSelections,
    setFinalSelections,
    getFinalSelections
  };
};
