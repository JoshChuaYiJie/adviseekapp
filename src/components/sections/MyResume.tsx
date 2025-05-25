
import { UploadResumeCard } from "@/components/resume/UploadResumeCard";
import { BuildResumeCard } from "@/components/resume/BuildResumeCard";
import { ResumeTable } from "@/components/resume/ResumeTable";
import { useResumeManager } from "@/hooks/useResumeManager";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    handleEditPDF,
    handleDeleteResume,
    handleDownloadResume
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

  // Adapter function to handle file upload from UploadResumeCard
  const handleFileUploadAdapter = (file: File) => {
    
    // Convert single file to array for handleFileUpload
    handleFileUpload([file]);
  };

  return (
    <div className="w-full h-full space-y-6">
      {!isUserAuthenticated && (
        <Alert variant="destructive">
          <AlertDescription>
            Log in to save your resumes and access them from any device.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Upload and Build Resume Cards */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <UploadResumeCard onFileUpload={handleFileUploadAdapter} />
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
        onDeleteResume={handleDeleteResume}
        onDownloadResume={handleDownloadResume}
      />
    </div>
  );
};
