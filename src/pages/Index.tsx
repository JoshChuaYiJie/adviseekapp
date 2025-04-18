
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/Sidebar";
import { AppliedProgrammes } from "@/components/sections/AppliedProgrammes";
import { MyResume } from "@/components/sections/MyResume";
import { ApplyNow } from "@/components/sections/ApplyNow";
import { MockInterviews } from "@/components/sections/MockInterviews";
import { GetPaid } from "@/components/sections/GetPaid";
import { Tutorial } from "@/components/Tutorial";
import AuthSection from "@/components/auth/AuthSection";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState("applied-programmes");
  const [showTutorial, setShowTutorial] = useState(false);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [lastVisitDate, setLastVisitDate] = useState<Date | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user || null;
      setUser(currentUser);
      
      if (currentUser) {
        // Save user to localStorage for reference by other components
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        // Check if this is a new user by looking for existing selections
        const { data: existingSelections } = await supabase
          .from('user_selections')
          .select('id, created_at')
          .eq('user_id', currentUser.id)
          .limit(1);
          
        // If no selections exist, assume this is a new user
        if (!existingSelections || existingSelections.length === 0) {
          // Check if tutorial has been shown before
          const tutorialCompleted = localStorage.getItem(`tutorial_completed_${currentUser.id}`);
          
          if (!tutorialCompleted) {
            setShowTutorial(true);
            
            // Create a record for this user
            await supabase.from('user_selections').insert({
              user_id: currentUser.id,
              module_id: 0 // Using a placeholder value since module_id is required
            });
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
        } else {
          localStorage.removeItem('user');
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  const renderContent = () => {
    switch (selectedSection) {
      case "applied-programmes":
        return <AppliedProgrammes />;
      case "my-resume":
        return <MyResume />;
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
      <div className="min-h-screen bg-gray-50 flex">
        <AppSidebar 
          selectedSection={selectedSection} 
          setSelectedSection={setSelectedSection} 
          user={user}
          onReplayTutorial={handleReplayTutorial}
        />
        
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {showWelcomeBack && (
              <Alert className="mb-6 bg-blue-50">
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
            
            <h1 className="text-2xl font-medium text-gray-800 mb-6">
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
