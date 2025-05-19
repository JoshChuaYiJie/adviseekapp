
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase, parseJsonArray } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const { toast: uiToast } = useToast();
  const navigate = useNavigate();

  // Load saved resumes from Supabase
  const loadSavedResumes = async () => {
    try {
      setLoading(true);
      console.log("[Resume Manager] Loading saved resumes");
      
      // Get the current user session
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("[Resume Manager] Auth session for resume loading:", sessionData);
      
      if (!sessionData.session?.user) {
        console.log("[Resume Manager] No user session found for resume loading");
        setLoading(false);
        return;
      }
      
      // Load resumes from Supabase
      const { data, error } = await supabase
        .from('resumes')
        .select('id, resumeName, template_type, updated_at')
        .eq('user_id', sessionData.session.user.id)
        .order('updated_at', { ascending: false });
        
      if (error) {
        console.error("[Resume Manager] Error loading resumes:", error);
        uiToast({
          title: "Error Loading Resumes",
          description: "There was a problem loading your saved resumes.",
          variant: "destructive",
        });
      } else if (data) {
        // Format the date for display and map resumeName to name
        const formattedResumes = data.map(resume => ({
          id: resume.id,
          name: resume.resumeName,
          template_type: resume.template_type,
          updated_at: new Date(resume.updated_at).toLocaleDateString()
        }));
        
        console.log(`[Resume Manager] Loaded ${formattedResumes.length} resumes from Supabase:`, formattedResumes);
        setSavedResumes(formattedResumes);
      } else {
        console.log("[Resume Manager] No resumes found");
      }
    } catch (error) {
      console.error("[Resume Manager] Error loading resumes:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadSavedResumes();
  }, [uiToast]);

  const handleFileUpload = (files: File[]) => {
    try {
      if (!files.length) {
        console.error("[Resume Manager] No files provided to handleFileUpload");
        return;
      }
      
      // Use the first file if multiple files were uploaded
      const file = files[0];
      console.log("[Resume Manager] Processing uploaded file:", file.name, file.type);
      
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
      console.log("[Resume Manager] Resume file added to state");
      
      toast({
        title: "Resume Uploaded",
        description: "Your resume has been uploaded successfully.",
      });
    } catch (error) {
      console.error("[Resume Manager] Error uploading file:", error);
      toast({
        title: "Upload Error",
        description: "There was a problem uploading your resume.",
        variant: "destructive",
      });
    }
  };

  const handleViewResume = async (resumeId: string, templateType: string) => {
    try {
      console.log(`[Resume Manager] Navigating to view resume: ${resumeId} with template: ${templateType}`);
      navigate(`/resumebuilder/${templateType.toLowerCase()}?id=${resumeId}&mode=view`);
    } catch (error) {
      console.error("[Resume Manager] Navigation error:", error);
      toast({
        title: "Navigation Error",
        description: "There was a problem viewing this resume.",
        variant: "destructive",
      });
    }
  };

  const handleEditResume = async (resumeId: string, templateType: string) => {
    try {
      console.log(`[Resume Manager] Navigating to edit resume: ${resumeId} with template: ${templateType}`);
      navigate(`/resumebuilder/${templateType.toLowerCase()}?id=${resumeId}&mode=edit`);
    } catch (error) {
      console.error("[Resume Manager] Navigation error:", error);
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
      console.log("[Resume Manager] PDF set in localStorage, navigating to resume builder");
      
      navigate('/resumebuilder/basic?source=pdf&mode=edit');
    } catch (error) {
      console.error("[Resume Manager] Navigation error:", error);
      toast({
        title: "Navigation Error",
        description: "There was a problem editing this PDF.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    try {
      console.log(`[Resume Manager] Deleting resume: ${resumeId}`);
      
      // Get the current user session
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session?.user) {
        console.log("[Resume Manager] No user session found for resume deletion");
        toast({
          title: "Authentication Error",
          description: "You must be logged in to delete a resume.",
          variant: "destructive",
        });
        return;
      }
      
      // Delete the resume from Supabase
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resumeId)
        .eq('user_id', sessionData.session.user.id);
        
      if (error) {
        console.error("[Resume Manager] Error deleting resume:", error);
        toast({
          title: "Deletion Error",
          description: "There was a problem deleting your resume.",
          variant: "destructive",
        });
        return;
      }
      
      // Update the saved resumes list
      setSavedResumes(prevResumes => prevResumes.filter(resume => resume.id !== resumeId));
      
      toast({
        title: "Resume Deleted",
        description: "Your resume has been deleted successfully.",
      });
    } catch (error) {
      console.error("[Resume Manager] Error deleting resume:", error);
      toast({
        title: "Deletion Error",
        description: "There was a problem deleting your resume.",
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
    handleDeleteResume,
  };
};
