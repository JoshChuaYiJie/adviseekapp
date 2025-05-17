import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useQuiz } from "@/contexts/QuizContext";
import { ModuleRatingCard } from "@/components/ModuleRatingCard";
import { useModuleRecommendations } from "@/hooks/useModuleRecommendations";
import { supabase } from "@/integrations/supabase/client";

interface ModuleRatingResult {
  prefix: string;
  totalScore: number;
  count: number;
  averageScore: number;
}

const Recommendations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    rateModule,
    userFeedback
  } = useQuiz();
  
  // Use our hook for recommendations
  const { 
    recommendedModules, 
    loadingModules: isLoading, 
    error,
    refetchRecommendations 
  } = useModuleRecommendations();

  // Log recommendations for debugging
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
  const [topPrefixes, setTopPrefixes] = useState<ModuleRatingResult[]>([]);
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

  // Check if user has previous ratings and handle them
  useEffect(() => {
    if (!userId) return;

    const checkPreviousRatings = async () => {
      try {
        // Check if user has previous ratings
        const { data: existingRatings, error: checkError } = await supabase
          .from('recommendations_score')
          .select('id')
          .eq('user_id', userId)
          .limit(1);

        if (checkError) {
          console.error("Error checking previous ratings:", checkError);
          return;
        }

        // If user is retaking the quiz and has previous ratings, delete them
        if (existingRatings && existingRatings.length > 0) {
          console.log("Found previous ratings, deleting them...");
          const { error: deleteError } = await supabase
            .from('recommendations_score')
            .delete()
            .eq('user_id', userId);

          if (deleteError) {
            console.error("Error deleting previous ratings:", deleteError);
            toast({
              title: "Error",
              description: "Could not reset your previous ratings. Please try again.",
              variant: "destructive",
            });
          } else {
            console.log("Previous ratings deleted successfully");
            toast({
              title: "Previous Ratings Reset",
              description: "Your previous module ratings have been cleared. Start fresh!",
            });
          }
        }
      } catch (err) {
        console.error("Error in checkPreviousRatings:", err);
      }
    };

    checkPreviousRatings();
  }, [userId, toast]);

  // Ensure recommendations are loaded when the page loads
  useEffect(() => {
    console.log("Trying to fetch recommendations...");
    refetchRecommendations();
  }, [refetchRecommendations]);

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
      // Calculate top prefixes and aggregate scores
      aggregateModuleScores();
      
      // Show completion message
      toast({
        title: "All modules rated",
        description: "Thank you for rating all the modules. Your top program areas have been calculated.",
      });
    }
  }, [allModulesRated, toast]);

  const extractPrefix = (courseCode: string): string => {
    const match = courseCode.match(/^[A-Z]+/);
    return match ? match[0] : 'OTHER';
  };

  const aggregateModuleScores = async () => {
    try {
      if (!userId) return;

      // Get all user ratings from Supabase
      const { data: userRatings, error } = await supabase
        .from('recommendations_score')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error("Error fetching user ratings:", error);
        return;
      }

      if (!userRatings || userRatings.length === 0) {
        console.log("No ratings found for aggregation");
        return;
      }

      console.log("Retrieved user ratings for aggregation:", userRatings.length);

      // Aggregate scores by prefix
      const prefixScores: Record<string, { totalScore: number, count: number }> = {};
      
      userRatings.forEach(rating => {
        const prefix = rating.module_prefix;
        
        if (!prefixScores[prefix]) {
          prefixScores[prefix] = { totalScore: 0, count: 0 };
        }
        
        prefixScores[prefix].totalScore += rating.rating;
        prefixScores[prefix].count += 1;
      });

      // Calculate averages and sort to find top prefixes
      const results: ModuleRatingResult[] = Object.entries(prefixScores)
        .map(([prefix, { totalScore, count }]) => ({
          prefix,
          totalScore,
          count,
          averageScore: totalScore / count
        }))
        .sort((a, b) => b.averageScore - a.averageScore);

      console.log("Top prefixes calculated:", results);
      setTopPrefixes(results.slice(0, 3));  // Keep top 3
      
      // Show the program suggestion
      setShowSuggestion(true);
    } catch (err) {
      console.error("Error aggregating module scores:", err);
    }
  };

  const handleRate = async () => {
    const currentModule = recommendations[currentIndex];
    if (!currentModule || !userId) return;

    try {
      setShowAnimation(false);
      
      // Use existing rateModule function for state updates
      await rateModule(currentModule.module_id, rating);

      // Also save to the new recommendations_score table
      const moduleCode = currentModule.module.course_code;
      const modulePrefix = extractPrefix(moduleCode);
      
      const { error } = await supabase
        .from('recommendations_score')
        .insert({
          user_id: userId,
          module_code: moduleCode,
          module_prefix: modulePrefix, 
          rating: rating
        });
      
      if (error) {
        console.error("Error saving rating to recommendations_score:", error);
        toast({
          title: "Error Saving Rating",
          description: "There was a problem saving your rating to the database.",
          variant: "destructive",
        });
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (currentIndex < recommendations.length - 1) {
        setCurrentIndex(prevIndex => prevIndex + 1);
        setRating(5);
        setShowAnimation(true);
      } else {
        // All modules have been rated - set flag to trigger completion actions
        setAllModulesRated(true);
      }

      // Check if the user has rated a multiple of 30 modules
      const newCount = Object.keys(userFeedback).length + 1;
      if (newCount % 30 === 0 && !allModulesRated) {
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

  // Show loading state while fetching recommendations
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ede9fe] to-[#f3e8ff] text-gray-900 flex flex-col items-center justify-center p-8 font-open-sans">
        <div className="animate-spin w-12 h-12 border-t-2 border-purple-400 border-r-2 rounded-full mb-4"></div>
        <h2 className="text-2xl font-medium">Loading recommendations...</h2>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ede9fe] to-[#f3e8ff] text-gray-900 flex flex-col items-center justify-center p-8 font-open-sans">
        <h2 className="text-3xl font-bold text-red-400 mb-4">Error</h2>
        <p className="mb-8">{error}</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  // Show empty state if there are no recommendations
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ede9fe] to-[#f3e8ff] text-gray-900 flex flex-col items-center justify-center p-8 font-open-sans">
        <h2 className="text-3xl font-bold mb-4">No Recommendations Available</h2>
        <p className="mb-8">We couldn't find any recommendations based on your responses.</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  // Get the current module
  const currentModule = recommendations[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ede9fe] to-[#f3e8ff] text-gray-900 font-poppins flex flex-col">
      {/* Header */}
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
        {showSuggestion && !allModulesRated && (
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

        {showProgramme && !allModulesRated && (
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

        {allModulesRated && topPrefixes.length > 0 && (
          <div className="text-center animate-fade-in bg-white/80 shadow-lg p-8 rounded-2xl max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-purple-700">Your Top Program Areas</h2>
            <div className="space-y-6 mb-8">
              {topPrefixes.map((result, idx) => (
                <div key={result.prefix} className="bg-white/60 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-purple-800">#{idx + 1}: {result.prefix}</span>
                    <span className="text-lg font-medium text-purple-600">
                      {result.averageScore.toFixed(1)}/10
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">
                    Based on {result.count} module ratings with total score {result.totalScore}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-lg mb-8 text-gray-700">
              Your results show you have a strong preference for these program areas. 
              Consider exploring majors related to these prefixes.
            </p>
            <Button 
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold"
            >
              Continue to Dashboard
            </Button>
          </div>
        )}

        {!showSuggestion && !showProgramme && !allModulesRated && currentModule && (
          <ModuleRatingCard
            module={currentModule.module}
            courseCode={currentModule.module?.course_code}
            description={currentModule.module?.description || "No description available."}
            reason={currentModule.reason}
            showAnimation={showAnimation}
          />
        )}

        {!showSuggestion && !showProgramme && !allModulesRated && currentModule && (
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
      </div>

      <footer className="p-4 text-center text-sm text-gray-400">
        © 2025 Adviseek - All rights reserved
      </footer>
    </div>
  );
};

export default Recommendations;
