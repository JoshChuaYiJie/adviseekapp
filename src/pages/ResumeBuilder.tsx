
import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useResumeTemplateSelection } from "@/hooks/useResumeTemplateSelection";
import { ResumeBuilderHeader } from "@/components/resume/ResumeBuilderHeader";
import { ResumeTemplateGrid } from "@/components/resume/ResumeTemplateGrid";

const ResumeBuilder = () => {
  const {
    selectedTemplate,
    showFullTemplate,
    handleSelectTemplate,
    handleCloseTemplate
  } = useResumeTemplateSelection();
  
  return (
    <TooltipProvider>
      <div className="container mx-auto py-10 max-w-7xl">
        <ResumeBuilderHeader 
          title="Resume Builder" 
          subtitle="Select a resume template tailored to your field of study or career path."
        />
        
        <ResumeTemplateGrid 
          selectedTemplate={selectedTemplate}
          onSelectTemplate={handleSelectTemplate}
        />
      </div>
    </TooltipProvider>
  );
};

export default ResumeBuilder;
