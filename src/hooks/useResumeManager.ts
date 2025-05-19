
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
  is_pdf_upload?: boolean;
  file_path?: string;
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
        .select('id, resumeName, template_type, updated_at, is_pdf_upload, file_path')
        .eq('user_id', sessionData.session.user.id)
        .order('updated_at', { ascending: false });
        
      if (error) {
        console.error("[Resume Manager] Error loading resumes:", error);
        uiToast({
          description: "There was a problem loading your saved resumes.",
          variant: "destructive",
        });
      } else if (data) {
        // Format the date for display and map resumeName to name
        const formattedResumes = data.map(resume => ({
          id: resume.id,
          name: resume.resumeName,
          template_type: resume.template_type,
          updated_at: new Date(resume.updated_at).toLocaleDateString(),
          is_pdf_upload: resume.is_pdf_upload,
          file_path: resume.file_path
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

  const handleFileUpload = async (files: File[]) => {
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
        toast("Please upload a PDF file.");
        return;
      }

      // Get the current user session
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session?.user) {
        console.log("[Resume Manager] No user session found for file upload");
        toast("You must be logged in to upload a resume.");
        return;
      }

      const userId = sessionData.session.user.id;
      const fileName = `${userId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      
      // Upload the file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resume_files')
        .upload(fileName, file, {
          contentType: 'application/pdf',
          cacheControl: '3600'
        });
        
      if (uploadError) {
        console.error("[Resume Manager] Error uploading file to storage:", uploadError);
        toast("There was a problem uploading your resume.");
        return;
      }

      console.log("[Resume Manager] File uploaded successfully:", uploadData);
      
      // Save the resume record in the database
      const { data: resumeData, error: resumeError } = await supabase
        .from('resumes')
        .insert({
          user_id: userId,
          resumeName: file.name,
          template_type: 'PDF Upload',
          file_path: fileName,
          is_pdf_upload: true,
        })
        .select();
        
      if (resumeError) {
        console.error("[Resume Manager] Error saving resume data:", resumeError);
        toast("There was a problem saving your resume information.");
        return;
      }

      console.log("[Resume Manager] Resume data saved:", resumeData);
      
      // Refresh the resumes list
      loadSavedResumes();
      
      toast("Your resume has been uploaded successfully.");
    } catch (error) {
      console.error("[Resume Manager] Error uploading file:", error);
      toast("There was a problem uploading your resume.");
    }
  };

  const handleViewResume = async (resumeId: string, templateType: string) => {
    try {
      console.log(`[Resume Manager] Navigating to view resume: ${resumeId} with template: ${templateType}`);
      navigate(`/resumebuilder/${templateType.toLowerCase()}?id=${resumeId}&mode=view`);
    } catch (error) {
      console.error("[Resume Manager] Navigation error:", error);
      toast("There was a problem viewing this resume.");
    }
  };

  const handleEditResume = async (resumeId: string, templateType: string) => {
    try {
      console.log(`[Resume Manager] Navigating to edit resume: ${resumeId} with template: ${templateType}`);
      navigate(`/resumebuilder/${templateType.toLowerCase()}?id=${resumeId}&mode=edit`);
    } catch (error) {
      console.error("[Resume Manager] Navigation error:", error);
      toast("There was a problem editing this resume.");
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
      toast("There was a problem editing this PDF.");
    }
  };

  const handleDownloadResume = async (resumePath: string | undefined, resumeName: string | null) => {
    try {
      if (!resumePath) {
        toast("Resume file not found.");
        return;
      }

      console.log(`[Resume Manager] Downloading resume at path: ${resumePath}`);
      
      const { data, error } = await supabase.storage
        .from('resume_files')
        .download(resumePath);
        
      if (error) {
        console.error("[Resume Manager] Error downloading file:", error);
        toast("There was a problem downloading your resume.");
        return;
      }
      
      // Create a URL for the downloaded file and initiate download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = resumeName || 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast("Resume download started.");
    } catch (error) {
      console.error("[Resume Manager] Error downloading resume:", error);
      toast("There was a problem downloading your resume.");
    }
  };

  const handleDeleteResume = async (resumeId: string, filePath?: string) => {
    try {
      console.log(`[Resume Manager] Deleting resume: ${resumeId}`);
      
      // Get the current user session
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session?.user) {
        console.log("[Resume Manager] No user session found for resume deletion");
        toast("You must be logged in to delete a resume.");
        return;
      }
      
      // If it's a PDF upload, delete the file from storage first
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('resume_files')
          .remove([filePath]);
          
        if (storageError) {
          console.error("[Resume Manager] Error deleting file from storage:", storageError);
          toast("There was a problem deleting the resume file.");
        }
      }
      
      // Delete the resume from Supabase
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resumeId)
        .eq('user_id', sessionData.session.user.id);
        
      if (error) {
        console.error("[Resume Manager] Error deleting resume:", error);
        toast("There was a problem deleting your resume.");
        return;
      }
      
      // Update the saved resumes list
      setSavedResumes(prevResumes => prevResumes.filter(resume => resume.id !== resumeId));
      
      toast("Your resume has been deleted successfully.");
    } catch (error) {
      console.error("[Resume Manager] Error deleting resume:", error);
      toast("There was a problem deleting your resume.");
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
    handleDownloadResume
  };
};
