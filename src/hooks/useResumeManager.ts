
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
        console.log("Auth session for resume loading:", sessionData);
        
        if (!sessionData.session?.user) {
          console.log("No user session found for resume loading");
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
        } else if (data) {
          // Format the date for display
          const formattedResumes = data.map(resume => ({
            ...resume,
            updated_at: new Date(resume.updated_at).toLocaleDateString()
          }));
          
          console.log(`Loaded ${formattedResumes.length} resumes from Supabase:`, formattedResumes);
          setSavedResumes(formattedResumes);
        } else {
          console.log("No resumes found");
        }
      } catch (error) {
        console.error("Error loading resumes:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSavedResumes();
  }, [toast]);

  const handleFileUpload = (files: File[]) => {
    try {
      if (!files.length) {
        console.error("No files provided to handleFileUpload");
        return;
      }
      
      // Use the first file if multiple files were uploaded
      const file = files[0];
      console.log("Processing uploaded file:", file.name, file.type);
      
      // Validate file type
      if (!file.type.includes('pdf')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        return;
      }
      
      setResumeFiles(prevFiles => [file, ...prevFiles]);
      console.log("Resume file added to state");
      
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

  const handleViewResume = async (resumeId: string, templateType: string) => {
    try {
      console.log(`Navigating to view resume: ${resumeId} with template: ${templateType}`);
      navigate(`/resumebuilder/${templateType.toLowerCase()}?id=${resumeId}&mode=view`);
    } catch (error) {
      console.error("Navigation error:", error);
      toast({
        title: "Navigation Error",
        description: "There was a problem viewing this resume.",
        variant: "destructive",
      });
    }
  };

  const handleEditResume = async (resumeId: string, templateType: string) => {
    try {
      console.log(`Navigating to edit resume: ${resumeId} with template: ${templateType}`);
      navigate(`/resumebuilder/${templateType.toLowerCase()}?id=${resumeId}&mode=edit`);
    } catch (error) {
      console.error("Navigation error:", error);
      toast({
        title: "Navigation Error",
        description: "There was a problem editing this resume.",
        variant: "destructive",
      });
    }
  };

  const handleEditPDF = (index: number) => {
    try {
      // Store the selected PDF in local storage for access in the resume builder
      const file = resumeFiles[index];
      if (!file) {
        throw new Error("Selected file not found");
      }
      
      // Create a blob URL for the file
      const fileUrl = URL.createObjectURL(file);
      localStorage.setItem('uploadedPDF', file.name);
      localStorage.setItem('uploadedPDFUrl', fileUrl);
      console.log("PDF set in localStorage, navigating to resume builder");
      
      navigate('/resumebuilder/basic?source=pdf');
    } catch (error) {
      console.error("Navigation error:", error);
      toast({
        title: "Navigation Error",
        description: "There was a problem editing this PDF.",
        variant: "destructive",
      });
    }
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
