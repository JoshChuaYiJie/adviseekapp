
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import AuthSection from "@/components/auth/AuthSection";
import { Home as HomeIcon, School, BarChart, BookOpen, GraduationCap, Users } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
      setLoading(false);
    };
    
    checkUser();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const handleAddUniversity = () => {
    if (!user) {
      navigate("/authorization");
    } else {
      navigate("/university-selection");
    }
  };
  
  const handleGiveFeedback = () => {
    // Placeholder for feedback functionality
    alert("Thank you for your interest in providing feedback!");
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
      </div>
    );
  }
  
  // If not logged in, show the auth section
  if (!user) {
    return <AuthSection />;
  }
  
  // If logged in, show the home page
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-[240px] bg-white border-r border-gray-200 flex flex-col h-screen">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-purple-600">Sups</span>
            <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-yellow-400 text-yellow-800 rounded">FREE</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-900">
            <HomeIcon className="mr-3 h-5 w-5 text-gray-500" />
            My Colleges
          </a>
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            <School className="mr-3 h-5 w-5 text-gray-500" />
            Activities
          </a>
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            <BookOpen className="mr-3 h-5 w-5 text-gray-500" />
            Background
          </a>
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            <Users className="mr-3 h-5 w-5 text-gray-500" />
            Common App
          </a>
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            <BarChart className="mr-3 h-5 w-5 text-gray-500" />
            Get Paid
          </a>
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            <GraduationCap className="mr-3 h-5 w-5 text-gray-500" />
            Professional Consulting
          </a>
        </nav>
        
        {/* Upgrade button */}
        <div className="p-4 mt-auto border-t border-gray-200">
          <button className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 11l5-5 5 5"/>
              <path d="M7 17l5-5 5 5"/>
            </svg>
            Upgrade
          </button>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 p-8">
        {/* Welcome section */}
        <div className="max-w-2xl mx-auto mt-8">
          <h1 className="text-2xl font-medium text-gray-800">Welcome, {user.email || "Student"}. Let's get to work.</h1>
          
          {/* Add University button */}
          <div className="mt-6">
            <button 
              onClick={handleAddUniversity}
              className="w-full px-4 py-3 text-left border border-gray-300 rounded-md hover:border-gray-400 transition-colors"
            >
              Add University
            </button>
          </div>
          
          {/* Request college text */}
          <p className="text-gray-600 text-center mt-4">Request a college.</p>
          
          {/* Feedback button */}
          <div className="flex justify-center mt-4">
            <button 
              onClick={handleGiveFeedback}
              className="px-6 py-2 text-sm font-medium text-blue-700 border border-blue-700 rounded-md hover:bg-blue-50 transition-colors"
            >
              Give Feedback
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
