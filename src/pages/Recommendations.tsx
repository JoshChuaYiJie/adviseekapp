
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

  useEffect(() => {
    // Show the first module with animation
    setShowAnimation(true);
  }, []);

  // Handle rating module
  const handleRate = async () => {
    const currentModule = recommendations[currentIndex];
    if (!currentModule) return;

    try {
      // Fade out the current card
      setShowAnimation(false);
      
      // Submit the rating
      await rateModule(currentModule.module_id, rating);
      
      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Move to next module or finish
      if (currentIndex < recommendations.length - 1) {
        setCurrentIndex(prevIndex => prevIndex + 1);
        setRating(5); // Reset rating to middle value
        setShowAnimation(true); // Show the next card with animation
      } else {
        // All modules rated
        toast({
          title: "All modules rated",
          description: "Thank you for rating all the modules. You can now refine your selections.",
        });
        
        // Optional: Redirect to a summary page or show completion message
        await refineRecommendations();
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
      {/* Header with progress */}
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

      {/* Module rating area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        {currentModule && (
          <ModuleRatingCard
            module={currentModule.module}
            courseCode={currentModule.module?.course_code}
            description={currentModule.module?.description || "No description available."}
            reason={currentModule.reason}
            showAnimation={showAnimation}
          />
        )}

        {/* Rating slider */}
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
      </div>

      {/* Footer with progress */}
      <footer className="p-4 text-center text-sm text-gray-400">
        © 2025 Adviseek - All rights reserved
      </footer>
    </div>
  );
};

export default Recommendations;
