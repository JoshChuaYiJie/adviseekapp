
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useQuiz } from "@/contexts/QuizContext";
import { ModuleRatingCard } from "@/components/ModuleRatingCard";

const Recommendations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    recommendations, 
    isLoading, 
    error,
    rateModule,
    userFeedback,
    refineRecommendations
  } = useQuiz();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [rating, setRating] = useState(5);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [showProgramme, setShowProgramme] = useState(false);
  const [ratedModulesCount, setRatedModulesCount] = useState(0);

  useEffect(() => {
    setShowAnimation(true);
  }, []);

  useEffect(() => {
    if (userFeedback) {
      setRatedModulesCount(Object.keys(userFeedback).length);
    }
  }, [userFeedback]);

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
        toast({
          title: "All modules rated",
          description: "Thank you for rating all the modules.",
        });
        
        await refineRecommendations();
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

  const handleRateMore = async () => {
    setShowSuggestion(false);
    setShowProgramme(false);
    await refineRecommendations();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#141414] to-[#242424] text-white flex flex-col items-center justify-center p-8">
        <div className="animate-spin w-12 h-12 border-t-2 border-white border-r-2 rounded-full mb-4"></div>
        <h2 className="text-xl font-medium">Loading recommendations...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#141414] to-[#242424] text-white flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
        <p className="mb-8">{error}</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#141414] to-[#242424] text-white flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold mb-4">No Recommendations Available</h2>
        <p className="mb-8">We couldn't find any recommendations based on your responses.</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const currentModule = recommendations[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#141414] to-[#242424] text-white flex flex-col">
      <header className="sticky top-0 z-10 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Module Recommendations</h1>
          <div className="text-sm font-medium">
            {currentIndex + 1} of {recommendations.length} modules
          </div>
        </div>
        <div className="container mx-auto mt-2">
          <div className="h-1 bg-gray-700 rounded-full">
            <div 
              className="h-full bg-white rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${((currentIndex + 1) / recommendations.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        {showSuggestion && (
          <div className="text-center animate-fade-in">
            <h2 className="text-3xl font-bold mb-4">Your suggested programme is ready!</h2>
            <p className="text-lg mb-8">View it now or rate 30 more modules for a more refined suggestion</p>
            <div className="space-x-4">
              <Button onClick={handleViewSuggestion}>View suggestion</Button>
              <Button onClick={handleRateMore}>Rate more modules</Button>
            </div>
          </div>
        )}

        {showProgramme && (
          <div className="text-center animate-fade-in">
            <h2 className="text-3xl font-bold mb-4">
              Your recommended programme is a degree in computer science in NUS with an optional major in economics
            </h2>
            <p className="text-lg mb-8">
              Based on your responses, you demonstrate strong analytical skills and interest in technology.
              Your learning style and career goals align well with the computer science program at NUS.
            </p>
            <div className="space-x-4">
              <Button onClick={handleAcceptSuggestion}>Accept suggestion</Button>
              <Button onClick={handleRateMore}>Rate more suggestions</Button>
            </div>
          </div>
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
          <div className="w-full max-w-md mt-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Not interested</span>
              <span className="font-bold text-lg">{rating}/10</span>
              <span className="text-sm">Very interested</span>
            </div>
            <Slider
              value={[rating]}
              min={1}
              max={10}
              step={1}
              onValueChange={([value]) => setRating(value)}
              className="mb-6"
            />
            <Button 
              onClick={handleRate}
              size="lg"
              className="w-full bg-transparent border border-white/30 hover:border-white/80 hover:bg-white/10 transition-all hover:scale-105 py-6"
            >
              Rate and Continue
            </Button>
          </div>
        )}
      </div>

      <footer className="p-4 text-center text-sm text-gray-400">
        © 2025 Adviseek - All rights reserved
      </footer>
    </div>
  );
};

export default Recommendations;
