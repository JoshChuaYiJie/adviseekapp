
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import QuizDebugger from "@/components/QuizDebugger";

const QuizDebugPage = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [authError, setAuthError] = useState<string | null>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth error:", error);
          setAuthError(error.message);
          setAuthStatus('unauthenticated');
          return;
        }
        
        if (session?.user) {
          setUserId(session.user.id);
          setAuthStatus('authenticated');
          console.log("User authenticated:", session.user.id);
        } else {
          setUserId(null);
          setAuthStatus('unauthenticated');
          console.log("User not authenticated");
        }
      } catch (err) {
        console.error("Error checking authentication:", err);
        setAuthStatus('unauthenticated');
        setAuthError(err instanceof Error ? err.message : "Unknown error");
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
      setAuthStatus(session?.user ? 'authenticated' : 'unauthenticated');
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Quiz Debugging Tools</h1>
        
        <div className="mb-6">
          <p className="text-gray-600">
            These tools help debug issues with quiz response saving and Supabase integration.
          </p>
        </div>
        
        <QuizDebugger 
          userId={userId}
          authStatus={authStatus}
        />
      </div>
    </div>
  );
};

export default QuizDebugPage;
