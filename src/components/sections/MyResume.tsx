
import { UploadResumeCard } from "@/components/resume/UploadResumeCard";
import { BuildResumeCard } from "@/components/resume/BuildResumeCard";
import { ResumeTable } from "@/components/resume/ResumeTable";
import { useResumeManager } from "@/hooks/useResumeManager";
import { useTranslation } from "react-i18next";

export const MyResume = () => {
  const { t } = useTranslation();
  const {
    resumeFiles,
    savedResumes,
    loading,
    handleFileUpload,
    handleViewResume,
    handleEditResume,
    handleEditPDF
  } = useResumeManager();

  return (
    <div className="w-full h-full space-y-6">
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
