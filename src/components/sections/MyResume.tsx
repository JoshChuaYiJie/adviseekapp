
import { UploadResumeCard } from "@/components/resume/UploadResumeCard";
import { BuildResumeCard } from "@/components/resume/BuildResumeCard";
import { ResumeTable } from "@/components/resume/ResumeTable";
import { useResumeManager } from "@/hooks/useResumeManager";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const MyResume = () => {
  const { t } = useTranslation();
  const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean>(false);
  const {
    resumeFiles,
    savedResumes,
    loading,
    handleFileUpload,
    handleViewResume,
    handleEditResume,
    handleEditPDF
  } = useResumeManager();

  // Check if user is authenticated
  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data } = await supabase.auth.getSession();
      setIsUserAuthenticated(!!data.session);
    };
    
    checkAuthStatus();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsUserAuthenticated(!!session);
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="w-full h-full space-y-6">
      {!isUserAuthenticated && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-yellow-700">
            Log in to save your resumes and access them from any device.
          </p>
        </div>
      )}
      
      {/* Upload and Build Resume Cards */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <UploadResumeCard onFileUpload={handleFileUpload} />
        <BuildResumeCard />
      </div>
      
      {/* Resume List */}
      <ResumeTable 
        loading={loading}
        savedResumes={savedResumes}
        resumeFiles={resumeFiles}
        onViewResume={handleViewResume}
        onEditResume={handleEditResume}
        onEditPDF={handleEditPDF}
      />
    </div>
  );
};
