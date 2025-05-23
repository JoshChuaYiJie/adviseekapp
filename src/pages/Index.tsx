import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/Sidebar";
import { AppliedProgrammes } from "@/components/sections/AppliedProgrammes";
import { AboutMe } from "@/components/sections/AboutMe";
import { ApplyNow } from "@/components/sections/ApplyNow";
import { MockInterviews } from "@/components/sections/MockInterviews";
import { GetPaid } from "@/components/sections/GetPaid";
import { Tutorial } from "@/components/Tutorial";
import AuthSection from "@/components/auth/AuthSection";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import OpenEndedQuiz from "./OpenEndedQuiz";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState("about-me");
  const [showTutorial, setShowTutorial] = useState(false);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [lastVisitDate, setLastVisitDate] = useState<Date | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isCurrentlyDark } = useTheme();

  useEffect(() => {
    // Check for section parameter in URL
    const queryParams = new URLSearchParams(location.search);
    const sectionParam = queryParams.get('section');
    
    if (sectionParam) {
      setSelectedSection(sectionParam);
    }
    
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user || null;
      setUser(currentUser);
      
      if (currentUser) {
        // Save user to localStorage for reference by other components
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        // Check if this is a new user by looking at when they were created
        const userCreatedAt = new Date(currentUser.created_at);
        const now = new Date();
        const timeDiff = now.getTime() - userCreatedAt.getTime();
        const minutesDiff = timeDiff / (1000 * 60);
        
        // If user was created within the last 5 minutes, consider them new
        const isNewUser = minutesDiff < 5;
        
        if (isNewUser) {
          // Check if tutorial has been shown before
          const tutorialCompleted = localStorage.getItem(`tutorial_completed_${currentUser.id}`);
          
          if (!tutorialCompleted) {
            setShowTutorial(true);
          }
        } else {
          // For returning users, we'll show a welcome back message if it's been more than 7 days
          const lastVisit = localStorage.getItem(`last_visit_${currentUser.id}`);
          
          if (lastVisit) {
            const lastVisitTime = new Date(lastVisit);
            setLastVisitDate(lastVisitTime);
            
            const daysSinceLastVisit = Math.floor((Date.now() - lastVisitTime.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceLastVisit > 7) {
              setShowWelcomeBack(true);
            }
          }
          
          // Update last visit time in localStorage
          localStorage.setItem(`last_visit_${currentUser.id}`, new Date().toISOString());
        }
      }
      
      setLoading(false);
    };
    
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const newUser = session?.user || null;
        setUser(newUser);
        
        if (newUser) {
          localStorage.setItem('user', JSON.stringify(newUser));
          
          // If this is a sign-in event for a new user, show tutorial
          if (event === 'SIGNED_IN') {
            const userCreatedAt = new Date(newUser.created_at);
            const now = new Date();
            const timeDiff = now.getTime() - userCreatedAt.getTime();
            const minutesDiff = timeDiff / (1000 * 60);
            
            // If user was created within the last 5 minutes, show tutorial
            if (minutesDiff < 5) {
              setShowTutorial(true);
            }
          }
        } else {
          localStorage.removeItem('user');
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [location.search, navigate]);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    
    // Store tutorial completion status
    if (user) {
      localStorage.setItem(`tutorial_completed_${user.id}`, 'true');
    }
  };

  const handleReplayTutorial = () => {
    setShowTutorial(true);
  };

  const handleCloseWelcomeBack = () => {
    setShowWelcomeBack(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthSection />;
  }

  // Check if we're on the open-ended quiz route and render it directly
  if (location.pathname === '/open-ended') {
    return <OpenEndedQuiz />;
  }

  // Remove references to university-selection
  const renderContent = () => {
    switch (selectedSection) {
      case "applied-programmes":
        return <AppliedProgrammes />;
      case "about-me":
        return <AboutMe />;
      case "apply-now":
        return <ApplyNow />;
      case "mock-interviews":
        return <MockInterviews user={user} />;
      case "get-paid":
        return <GetPaid />;
      default:
        return <p>Placeholder</p>;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <AppSidebar 
          selectedSection={selectedSection} 
          setSelectedSection={setSelectedSection} 
          user={user}
          onReplayTutorial={handleReplayTutorial}
        />
        
        <main className={`flex-1 p-6 overflow-auto ${isCurrentlyDark ? 'bg-gray-900 text-white' : ''}`}>
          <div className="w-full h-full">
            {showWelcomeBack && (
              <Alert className={`mb-6 ${isCurrentlyDark ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-blue-50'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <AlertTitle>Welcome back!</AlertTitle>
                    <AlertDescription>
                      It's been a while since your last visit. We've added some new features to help with your university applications.
                    </AlertDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleCloseWelcomeBack} className="mt-1">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Alert>
            )}
            
            <h1 className={`text-2xl font-medium ${isCurrentlyDark ? 'text-white' : 'text-gray-800'} mb-6`}>
              Welcome, {user.email || "Student"}. Let's get to work.
            </h1>
            {renderContent()}
          </div>
        </main>
        
        {showTutorial && (
          <Tutorial isOpen={true} onClose={handleCloseTutorial} onSkip={handleCloseTutorial} />
        )}
      </div>
    </SidebarProvider>
  );
};

export default Index;
