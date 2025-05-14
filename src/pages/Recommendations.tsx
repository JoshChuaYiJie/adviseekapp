
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQuiz } from "@/contexts/QuizContext";
import { ModuleRatingCard } from "@/components/ModuleRatingCard";
import { useGlobalProfile } from "@/contexts/GlobalProfileContext";
import { UIModule } from "@/utils/recommendation/types";

// Import our new components
import { LoadingCard } from "@/components/recommendations/LoadingCard";
import { ErrorCard } from "@/components/recommendations/ErrorCard";
import { EmptyStateCard } from "@/components/recommendations/EmptyStateCard";
import { ProgressHeader } from "@/components/recommendations/ProgressHeader";
import { RateModuleCard } from "@/components/recommendations/RateModuleCard";
import { SuggestionCard } from "@/components/recommendations/SuggestionCard";
import { ProgrammeCard } from "@/components/recommendations/ProgrammeCard";
import { CompletionCard } from "@/components/recommendations/CompletionCard";
import { getModuleId } from "@/components/recommendations/utils";

const Recommendations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    rateModule,
    userFeedback
  } = useQuiz();
  
  // Use the global profile context
  const { 
    recommendedModules, 
    isLoading, 
    error
  } = useGlobalProfile();

  // Log immediately for debugging
  console.log("Recommendations in /recommendations page:", recommendedModules.length);

  // Convert modules to the format expected by this component
  const recommendations = recommendedModules.map((rec) => ({
    module: {
      id: getModuleId(rec.modulecode),
      university: rec.institution,
      course_code: rec.modulecode,
      title: rec.title,
      description: rec.description || "No description available.",
      aus_cus: 4,
      semester: "1" 
    } as UIModule,
    module_id: getModuleId(rec.modulecode),
    user_id: "",
    reason: "Recommended based on your major preferences",
    created_at: new Date().toISOString()
  }));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [rating, setRating] = useState(5);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [showProgramme, setShowProgramme] = useState(false);
  const [ratedModulesCount, setRatedModulesCount] = useState(0);
  const [allModulesRated, setAllModulesRated] = useState(false);

  useEffect(() => {
    setShowAnimation(true);
    // Log whenever recommendations change
    console.log("Recommendations updated in effect:", recommendations.length, recommendations);
  }, [recommendations.length]);

  useEffect(() => {
    if (userFeedback) {
      setRatedModulesCount(Object.keys(userFeedback).length);
    }
  }, [userFeedback]);
  
  // Effect to handle redirect after rating all modules
  useEffect(() => {
    if (allModulesRated) {
      // Show completion message and redirect after a delay
      toast({
        title: "All modules rated",
        description: "Thank you for rating all the modules. Redirecting to dashboard...",
      });
      
      // Use a timeout to allow the user to see the completion message
      const redirectTimer = setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [allModulesRated, navigate, toast]);

  const handleRate = async () => {
    const currentModule = recommendations[currentIndex];
    if (!currentModule) return;

    try {
      setShowAnimation(false);
      await rateModule(currentModule.module_id, rating);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (currentIndex < recommendations.length - 1) {
        setCurrentIndex(prevIndex => prevIndex + 1);
        setRating(5);
        setShowAnimation(true);
      } else {
        // All modules have been rated - set flag to trigger the redirect
        setAllModulesRated(true);
      }

      // Check if the user has rated a multiple of 30 modules
      const newCount = Object.keys(userFeedback).length + 1;
      if (newCount % 30 === 0) {
        setShowSuggestion(true);
      }
    } catch (err) {
      console.error("Error rating module:", err);
      toast({
        title: "Rating Error",
        description: "There was a problem saving your rating. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewSuggestion = () => {
    setShowSuggestion(false);
    setShowProgramme(true);
  };

  const handleAcceptSuggestion = () => {
    navigate("/university-selection", { 
      state: { 
        university: "nus",
        school: "computing"
      } 
    });
  };

  const handleRateMore = () => {
    setShowSuggestion(false);
    setShowProgramme(false);
  };

  // Rendering conditions
  if (isLoading) {
    return <LoadingCard />;
  }

  if (error) {
    return <ErrorCard error={error} onBack={() => navigate(-1)} />;
  }

  if (!recommendations || recommendations.length === 0) {
    return <EmptyStateCard onBack={() => navigate(-1)} />;
  }

  console.log('Final recommendations in /recommendations page:', recommendations);
  const currentModule = recommendations[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ede9fe] to-[#f3e8ff] text-gray-900 font-poppins flex flex-col">
      <ProgressHeader 
        currentIndex={currentIndex} 
        totalModules={recommendations.length} 
      />

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        {showSuggestion && (
          <SuggestionCard 
            onViewSuggestion={handleViewSuggestion} 
            onRateMore={handleRateMore} 
          />
        )}

        {showProgramme && (
          <ProgrammeCard 
            onAcceptSuggestion={handleAcceptSuggestion} 
            onRateMore={handleRateMore} 
          />
        )}

        {!showSuggestion && !showProgramme && currentModule && (
          <ModuleRatingCard
            module={currentModule.module}
            courseCode={currentModule.module?.course_code}
            description={currentModule.module?.description || "No description available."}
            reason={currentModule.reason}
            showAnimation={showAnimation}
          />
        )}

        {!showSuggestion && !showProgramme && currentModule && (
          <RateModuleCard 
            rating={rating}
            onRatingChange={setRating}
            onRate={handleRate}
          />
        )}

        {allModulesRated && <CompletionCard />}
      </div>

      <footer className="p-4 text-center text-sm text-gray-400">
        © 2025 Adviseek - All rights reserved
      </footer>
    </div>
  );
};

export default Recommendations;
