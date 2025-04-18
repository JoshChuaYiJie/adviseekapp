
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

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState("applied-programmes");
  const [showTutorial, setShowTutorial] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user || null;
      setUser(currentUser);
      
      // Check if this is a new user who should see the tutorial
      if (currentUser) {
        const { data: existingData } = await supabase
          .from('user_selections')
          .select('id')
          .eq('user_id', currentUser.id)
          .limit(1);
          
        // If no selections exist, assume this is a new user
        if (!existingData || existingData.length === 0) {
          setShowTutorial(true);
        }
      }
      
      setLoading(false);
    };
    
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    
    // In a real app, you'd want to store this preference so the tutorial doesn't show again
    // await supabase.from('user_preferences').insert({ user_id: user.id, tutorial_completed: true });
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
        />
        
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-medium text-gray-800 mb-6">
              Welcome, {user.email || "Student"}. Let's get to work.
            </h1>
            {renderContent()}
          </div>
        </main>
        
        {showTutorial && (
          <Tutorial isOpen={true} onClose={handleCloseTutorial} />
        )}
      </div>
    </SidebarProvider>
  );
};

export default Index;
