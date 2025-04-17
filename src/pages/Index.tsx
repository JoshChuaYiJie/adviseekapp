
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/Sidebar";
import UserMenu from "@/components/UserMenu";
import { AppliedProgrammes } from "@/components/sections/AppliedProgrammes";
import { MyResume } from "@/components/sections/MyResume";
import { ApplyNow } from "@/components/sections/ApplyNow";
import AuthSection from "@/components/auth/AuthSection";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState("applied-programmes");

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
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
      default:
        return <p>Placeholder</p>;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex">
        <AppSidebar selectedSection={selectedSection} setSelectedSection={setSelectedSection} />
        
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-medium text-gray-800 mb-6">
              Welcome, {user.email || "Student"}. Let's get to work.
            </h1>
            {renderContent()}
          </div>
        </main>

        <div className="p-4 mt-auto border-t border-gray-200 space-y-2">
          <UserMenu user={user} />
          <button 
            onClick={() => navigate("/pricing")} 
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 11l5-5 5 5"/>
              <path d="M7 17l5-5 5 5"/>
            </svg>
            Upgrade
          </button>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
