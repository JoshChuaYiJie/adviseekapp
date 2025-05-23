
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/Sidebar";
import { AboutMe } from "@/components/sections/AboutMe";
import { AppliedProgrammes } from "@/components/sections/AppliedProgrammes";
import { ApplyNow } from "@/components/sections/ApplyNow";
import { MockInterviews } from "@/components/sections/MockInterviews";
import { GetPaid } from "@/components/sections/GetPaid";
import { ChatWithAI } from "@/components/ChatWithAI";
import FeedbackForm from "@/components/FeedbackForm";
import UpgradeModal from "@/components/UpgradeModal";
import { Tutorial } from "@/components/Tutorial";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Index() {
  const [selectedSection, setSelectedSection] = useState("about-me");
  const [user, setUser] = useState<any>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [searchParams] = useSearchParams();
  const { isCurrentlyDark } = useTheme();
  const hasCheckedAuth = useRef(false);

  // Check for tutorial parameter
  useEffect(() => {
    if (searchParams.get('tutorial') === 'true') {
      setShowTutorial(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    const getUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          return;
        }

        if (session?.user) {
          // Fetch the user's profile data
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error("Error fetching profile:", profileError);
          }

          setUser({
            ...session.user,
            profile: profileData
          });
        }
      } catch (error) {
        console.error("Error in getUser:", error);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Fetch the user's profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching profile:", profileError);
        }

        setUser({
          ...session.user,
          profile: profileData
        });
        toast.success("Successfully signed in!");
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const renderContent = () => {
    switch (selectedSection) {
      case "about-me":
        return <AboutMe user={user} />;
      case "applied-programmes":
        return <AppliedProgrammes user={user} />;
      case "apply-now":
        return <ApplyNow user={user} />;
      case "mock-interviews":
        return <MockInterviews user={user} />;
      case "get-paid":
        return <GetPaid user={user} />;
      default:
        return <AboutMe user={user} />;
    }
  };

  const handleReplayTutorial = () => {
    setShowTutorial(true);
  };

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className={`min-h-screen w-full transition-colors duration-200 ${isCurrentlyDark ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
          <AppSidebar 
            selectedSection={selectedSection} 
            setSelectedSection={setSelectedSection}
            user={user}
            onReplayTutorial={handleReplayTutorial}
          />
          
          <main className="w-full min-h-screen transition-all duration-300 ease-in-out ml-0 lg:ml-64">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
              {renderContent()}
            </div>
          </main>

          <ChatWithAI />
          <FeedbackForm />
          
          <UpgradeModal 
            open={upgradeModalOpen} 
            onOpenChange={setUpgradeModalOpen} 
          />

          {showTutorial && (
            <Tutorial onComplete={() => setShowTutorial(false)} />
          )}
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
