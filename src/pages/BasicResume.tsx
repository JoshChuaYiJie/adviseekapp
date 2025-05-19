import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useResumeManager } from "@/hooks/useResumeManager";
import { ResumeSection } from "@/components/resume/ResumeSection";

const BasicResume = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getResumeById, updateResume } = useResumeManager();
  const [resumeData, setResumeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Extract resume ID from URL query parameters
  const params = new URLSearchParams(location.search);
  const resumeId = params.get('id');
  const mode = params.get('mode') || 'view';

  useEffect(() => {
    if (resumeId) {
      const resume = getResumeById(resumeId);
      if (resume) {
        setResumeData(resume);
      } else {
        // Handle case where resume doesn't exist
        navigate('/resumebuilder');
      }
    }
    setLoading(false);
  }, [resumeId, getResumeById, navigate]);

  const handleUpdateSection = (sectionId: string, newContent: string) => {
    if (!resumeData) return;

    const updatedSections = { ...resumeData.sections };
    updatedSections[sectionId] = newContent;

    const updatedResume = {
      ...resumeData,
      sections: updatedSections
    };

    setResumeData(updatedResume);
    updateResume(resumeId!, updatedResume);
  };

  const handleBackNavigation = () => {
    navigate('/resumebuilder');
  };

  if (loading) {
    return <div className="container mx-auto py-10">Loading...</div>;
  }

  if (!resumeData) {
    return <div className="container mx-auto py-10">Resume not found.</div>;
  }

  const templateConfig = resumeData.template.templateData.sections;

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={handleBackNavigation} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{mode === 'edit' ? 'Edit Resume' : 'View Resume'}</h1>
      </div>

      {mode === 'edit' ? (
        <div className="space-y-8">
          {templateConfig.map((section: any) => (
            <ResumeSection
              key={section.id}
              id={section.id}
              name={section.name}
              content={resumeData.sections[section.id] || ""}
              placeholder={section.placeholder}
              onSave={handleUpdateSection}
              inputType={section.id === 'header' ? 'input' : 'textarea'}
            />
          ))}
        </div>
      ) : (
        <div className="resume-preview border p-8 rounded-md">
          <h2 className="text-xl font-semibold mb-4">Resume Preview</h2>
          <div className="space-y-4">
            {templateConfig.map((section: any) => (
              <div key={section.id}>
                <h3 className="text-lg font-medium">{section.name}</h3>
                <p>{resumeData.sections[section.id] || "No information added."}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BasicResume;
