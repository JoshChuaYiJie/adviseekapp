
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export interface SavedResume {
  id: string;
  name: string | null;
  template_type: string;
  updated_at: string;
}

export const useResumeManager = () => {
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load saved resumes from Supabase
  useEffect(() => {
    const loadSavedResumes = async () => {
      try {
        setLoading(true);
        
        // Get the current user session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData.session?.user) {
          console.log("No user session found");
          setLoading(false);
          return;
        }
        
        // Load resumes from Supabase
        const { data, error } = await supabase
          .from('resumes')
          .select('id, name, template_type, updated_at')
          .eq('user_id', sessionData.session.user.id)
          .order('updated_at', { ascending: false });
          
        if (error) {
          console.error("Error loading resumes:", error);
          toast({
            title: "Error Loading Resumes",
            description: "There was a problem loading your saved resumes.",
            variant: "destructive",
          });
          return;
        }
        
        if (data) {
          // Format the date for display
          const formattedResumes = data.map(resume => ({
            ...resume,
            updated_at: new Date(resume.updated_at).toLocaleDateString()
          }));
          
          console.log(`Loaded ${formattedResumes.length} resumes from Supabase`);
          setSavedResumes(formattedResumes);
        }
      } catch (error) {
        console.error("Error loading resumes:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSavedResumes();
  }, [toast]);

  const handleFileUpload = (file: File) => {
    try {
      // Validate file type
      if (!file.type.includes('pdf')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        return;
      }
      
      setResumeFiles([file, ...resumeFiles]);
      
      toast({
        title: "Resume Uploaded",
        description: "Your resume has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload Error",
        description: "There was a problem uploading your resume.",
        variant: "destructive",
      });
    }
  };

  const handleViewResume = (resumeId: string, templateType: string) => {
    navigate(`/resumebuilder/${templateType}?id=${resumeId}&mode=view`);
  };

  const handleEditResume = (resumeId: string, templateType: string) => {
    navigate(`/resumebuilder/${templateType}?id=${resumeId}&mode=edit`);
  };

  const handleEditPDF = (index: number) => {
    // Store the selected PDF in local storage for access in the resume builder
    localStorage.setItem('uploadedPDF', resumeFiles[index].name);
    navigate('/resumebuilder/basic?source=pdf');
  };

  return {
    resumeFiles,
    savedResumes,
    loading,
    handleFileUpload,
    handleViewResume,
    handleEditResume,
    handleEditPDF,
  };
};
