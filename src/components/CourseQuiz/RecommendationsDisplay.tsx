
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useQuiz } from '@/contexts/QuizContext';
import { Module } from '@/integrations/supabase/client';
import { RecommendationsSkeleton } from './RecommendationsSkeleton';
import { SelectionModal } from './SelectionModal';
import { useModuleRecommendations } from '@/hooks/useModuleRecommendations';
import { supabase } from '@/integrations/supabase/client';

interface RecommendationsDisplayProps {
  onBack: () => void;
  onReset: () => void;
}

export const RecommendationsDisplay: React.FC<RecommendationsDisplayProps> = ({ onBack, onReset }) => {
  const { toast } = useToast();
  const { 
    userFeedback, 
    rateModule, 
    getFinalSelections 
  } = useQuiz();
  
  // Use our hook for recommendations
  const { recommendedModules, loadingModules, error, refetchRecommendations } = useModuleRecommendations();
  
  // Log to check if recommendations are loaded
  console.log("RecommendationsDisplay: Module recommendations count:", recommendedModules.length);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selections, setSelections] = useState<{module: Module, reason: string}[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Get current user ID
  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getUserId();
  }, []);
  
  // Count rated modules
  const ratedModulesCount = Object.keys(userFeedback).length;
  
  // Get current rating for a module
  const getRating = (moduleId: number): number => {
    return userFeedback[moduleId] || 0;
  };
  
  // Extract prefix from course code
  const extractPrefix = (courseCode: string): string => {
    const match = courseCode.match(/^[A-Z]+/);
    return match ? match[0] : 'OTHER';
  };
  
  // Handle rating changes
  const handleRatingChange = async (moduleId: number, rating: number, courseCode: string) => {
    // Update state with the rating
    rateModule(moduleId, rating);
    
    // Also save to Supabase if user is logged in
    if (userId) {
      try {
        const modulePrefix = extractPrefix(courseCode);
        
        const { error } = await supabase
          .from('recommendations_score')
          .upsert({
            user_id: userId,
            module_code: courseCode,
            module_prefix: modulePrefix,
            rating: rating
          }, {
            onConflict: 'user_id,module_code'
          });
        
        if (error) {
          console.error("Error saving rating to recommendations_score:", error);
          toast({
            title: "Error Saving Rating",
            description: "There was a problem saving your rating to the database.",
            variant: "destructive",
          });
        } else {
          console.log(`Rating saved to database: ${moduleId} = ${rating}`);
        }
      } catch (err) {
        console.error("Error in handleRatingChange:", err);
      }
    } else {
      console.warn("User not logged in, rating saved only to local state");
    }
  };
  
  // Handle showing final selections
  const handleShowSelections = async () => {
    const selectionsResult = await getFinalSelections();
    if (selectionsResult && selectionsResult.length > 0) {
      // Convert the Module[] array to the expected format
      const formattedSelections = selectionsResult.map(module => ({
        module,
        reason: "Selected based on your preferences"
      }));
      
      setSelections(formattedSelections);
      setModalOpen(true);
    } else {
      toast({
        title: "No Selections Available",
        description: "Rate more modules to get course selections.",
        variant: "destructive",
      });
    }
  };
  
  if (loadingModules) return <RecommendationsSkeleton />;
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[60vh]">
        <h2 className="text-2xl font-bold text-red-600">Error Loading Recommendations</h2>
        <p className="mt-4 text-gray-700">{error}</p>
        <Button onClick={onBack} className="mt-8">Go Back</Button>
      </div>
    );
  }
  
  if (!recommendedModules || recommendedModules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[60vh]">
        <h2 className="text-2xl font-bold">No Recommendations Available</h2>
        <p className="mt-4 text-gray-700">We couldn't generate recommendations based on your responses.</p>
        <Button onClick={() => {
          console.log("Triggering recommendations refresh...");
          refetchRecommendations();
        }} className="mt-4">Refresh Recommendations</Button>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }
  
  // Format recommendations to match the expected structure for the UI
  const recommendations = recommendedModules.map((rec) => ({
    module: rec.module,
    module_id: rec.module.id,
    reasoning: rec.reasoning,
    user_id: '',
    created_at: new Date().toISOString(),
    reason: rec.reasoning[0] || "Recommended based on your major preferences"
  }));
  
  console.log("RecommendationsDisplay: Final formatted recommendations:", recommendations.length);
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white shadow-md p-4 z-10">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-center">Your Course Recommendations</h1>
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-gray-600">{ratedModulesCount}/{recommendations.length} modules rated</div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={onBack}
              >
                Back
              </Button>
              <Button 
                onClick={() => recommendations.length > 0}
                disabled={ratedModulesCount < 5}
              >
                Refine Recommendations
              </Button>
              <Button 
                onClick={handleShowSelections}
                disabled={ratedModulesCount < 5}
              >
                Confirm Selection
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Recommendations Grid */}
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((rec) => (
            <div 
              key={rec.module.id} 
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all hover:scale-[1.02]"
            >
              <h3 className="font-bold text-xl mb-2">{rec.module.title}</h3>
              <div className="text-sm text-gray-600 mb-2">
                {rec.module.course_code} • {rec.module.university} • {rec.module.aus_cus} AU/CU • {rec.module.semester}
              </div>
              <p className="text-gray-800 mb-4 text-sm">{rec.module.description || "No description available."}</p>
              <p className="text-gray-700 italic text-sm mb-4">{rec.reasoning && rec.reasoning.length > 0 ? rec.reasoning[0] : "Recommended based on your quiz responses."}</p>
              
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Rate this module</span>
                  <span className="text-sm font-medium">{getRating(rec.module.id)}/10</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs">1</span>
                  <Slider
                    value={[getRating(rec.module.id)]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={([value]) => handleRatingChange(rec.module.id, value, rec.module.course_code)}
                    className="flex-1"
                    aria-label={`Rate module ${rec.module.course_code}, 1 to 10`}
                  />
                  <span className="text-xs">10</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Not at all</span>
                  <span>I love it</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <SelectionModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selections={selections}
        onStartOver={onReset}
      />
    </div>
  );
};
