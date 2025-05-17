import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useQuiz } from "@/contexts/QuizContext";
import { ModuleRatingCard } from "@/components/ModuleRatingCard";
import { useModuleRecommendations } from "@/hooks/useModuleRecommendations";

const Recommendations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    rateModule,
    userFeedback
  } = useQuiz();
  
  // Use our new hook for recommendations
  const { 
    recommendedModules, 
    loadingModules: isLoading, 
    error 
  } = useModuleRecommendations();

  // Log immediately for debugging
  console.log("Recommendations in /recommendations page:", recommendedModules.length);

  // Convert recommendedModules to the same format as recommendations
  const recommendations = recommendedModules.map((rec) => ({
    module: rec.module,
    module_id: rec.module.id,
    user_id: "",
    reason: rec.reasoning[0] || "Recommended based on your major preferences",
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

  const handleRateMore = async () => {
    setShowSuggestion(false);
    setShowProgramme(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ede9fe] to-[#f3e8ff] text-gray-900 flex flex-col items-center justify-center p-8 font-open-sans">
        <div className="animate-spin w-12 h-12 border-t-2 border-purple-400 border-r-2 rounded-full mb-4"></div>
        <h2 className="text-2xl font-medium">Loading recommendations...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ede9fe] to-[#f3e8ff] text-gray-900 flex flex-col items-center justify-center p-8 font-open-sans">
        <h2 className="text-3xl font-bold text-red-400 mb-4">Error</h2>
        <p className="mb-8">{error}</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ede9fe] to-[#f3e8ff] text-gray-900 flex flex-col items-center justify-center p-8 font-open-sans">
        <h2 className="text-3xl font-bold mb-4">No Recommendations Available</h2>
        <p className="mb-8">We couldn't find any recommendations based on your responses.</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  console.log('Final recommendations in /recommendations page:', recommendations);
  const currentModule = recommendations[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ede9fe] to-[#f3e8ff] text-gray-900 font-poppins flex flex-col">
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-md border-b border-purple-100 p-4 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-purple-700 font-poppins drop-shadow-sm">Module Recommendations</h1>
          <div className="text-lg font-medium text-purple-400">
            {currentIndex + 1} of {recommendations.length} modules
          </div>
        </div>
        <div className="container mx-auto mt-2">
          <div className="h-1 bg-purple-100 rounded-full">
            <div 
              className="h-full bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${((currentIndex + 1) / recommendations.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        {showSuggestion && (
          <div className="text-center animate-fade-in bg-white/80 shadow-lg p-8 rounded-2xl max-w-xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-purple-700">Your suggested programme is ready!</h2>
            <p className="text-lg mb-8 text-gray-700">View it now or rate 30 more modules for a more refined suggestion</p>
            <div className="space-x-4">
              <Button 
                onClick={handleViewSuggestion}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold"
              >
                View suggestion
              </Button>
              <Button onClick={handleRateMore} variant="outline" className="font-bold border-purple-200">Rate more modules</Button>
            </div>
          </div>
        )}

        {showProgramme && (
          <div className="text-center animate-fade-in bg-white/80 shadow-lg p-8 rounded-2xl max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-purple-700">
              Your recommended programme is a degree in computer science in NUS with an optional major in economics
            </h2>
            <p className="text-lg mb-8 text-gray-700">
              Based on your responses, you demonstrate strong analytical skills and interest in technology.
              Your learning style and career goals align well with the computer science program at NUS.
            </p>
            <div className="space-x-4">
              <Button 
                onClick={handleAcceptSuggestion} 
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold"
              >
                Accept suggestion
              </Button>
              <Button onClick={handleRateMore} variant="outline" className="font-bold border-purple-200">Rate more suggestions</Button>
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
          <div className="w-full max-w-md mt-8 bg-white/90 shadow-md rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">Not interested</span>
              <span className="font-bold text-xl text-purple-500">{rating}/10</span>
              <span className="text-sm font-medium text-gray-500">Very interested</span>
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
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-6 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Rate and Continue
            </Button>
          </div>
        )}

        {allModulesRated && (
          <div className="text-center animate-fade-in bg-white/80 shadow-lg p-8 rounded-2xl max-w-xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-purple-700">Thank you for your ratings!</h2>
            <p className="text-lg mb-8 text-gray-700">Redirecting to your dashboard...</p>
            <div className="flex justify-center">
              <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
            </div>
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
