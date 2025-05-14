
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QuizSegments } from "./QuizSegments";
import { MyResume } from "./MyResume";
import { useGlobalProfile } from "@/contexts/GlobalProfileContext";
import { ProfileTabs } from "./about/ProfileTabs";
import { ProfileContent } from "./about/ProfileContent";
import { TooltipProvider } from "@/components/ui/tooltip";

export const AboutMe = () => {
  const [activeTab, setActiveTab] = useState<"quiz" | "profile" | "resume">("quiz");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  
  // Use the global profile context
  const { 
    riasecCode, 
    workValueCode
  } = useGlobalProfile();
  
  useEffect(() => {
    const loadUserProfiles = async () => {
      try {
        setIsLoading(true);

        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) {
          console.log("No user ID found");
          setIsLoading(false);
          return;
        }
        
        // Get completed quiz segments from database
        const { data: completions } = await supabase
          .from('quiz_completion')
          .select('quiz_type')
          .eq('user_id', userId);
        
        if (completions) {
          const completedSegments = completions.map(c => c.quiz_type);
          console.log("Fetched completed quiz segments:", completedSegments);
        }
      } catch (error) {
        console.error("Error loading user profiles:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserProfiles();
  }, [riasecCode, workValueCode]);

  const handleResumeClick = () => {
    navigate("/resumebuilder");
  };
  
  return (
    <TooltipProvider>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">About Me</h2>
            <p className="text-muted-foreground">
              Complete quizzes to learn more about your interests and strengths
            </p>
          </div>
          <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {activeTab === "quiz" ? (
          <QuizSegments />
        ) : activeTab === "profile" ? (
          <ProfileContent setActiveTab={setActiveTab} isLoading={isLoading} />
        ) : (
          <MyResume />
        )}
      </div>
    </TooltipProvider>
  );
};
