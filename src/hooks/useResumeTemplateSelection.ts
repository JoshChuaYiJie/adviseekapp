
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { resumeTemplates } from "@/utils/resumeTemplates";

export const useResumeTemplateSelection = () => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [showFullTemplate, setShowFullTemplate] = useState(false);
  
  const handleSelectTemplate = (templateId: number) => {
    const template = resumeTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      navigate(template.path);
      toast.success(`${template.name} template selected! You can now build your resume.`);
    }
  };

  const handleCloseTemplate = () => {
    setShowFullTemplate(false);
  };

  return {
    selectedTemplate,
    showFullTemplate,
    handleSelectTemplate,
    handleCloseTemplate
  };
};
