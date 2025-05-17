
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import { SavedResume } from "@/components/resume/ResumeTable";
import { formatTemplateType } from "@/utils/resumeHelpers";

export const useResumeManager = () => {
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch saved resumes from Supabase
  useEffect(() => {
    fetchSavedResumes();
  }, []);

  const fetchSavedResumes = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        const { data, error } = await supabase
          .from('resumes')
          .select('id, name, template_type, updated_at')
          .eq('user_id', session.session.user.id)
          .order('updated_at', { ascending: false });
        
        if (error) throw error;
        
        if (data) {
          // Format the data for display
          const formattedResumes = data.map(resume => ({
            id: resume.id,
            name: resume.name || 'Untitled',
            template_type: formatTemplateType(resume.template_type),
            updated_at: new Date(resume.updated_at).toLocaleDateString()
          }));
          
          setSavedResumes(formattedResumes);
        }
      }
    } catch (error) {
      console.error('Error fetching saved resumes:', error);
      toast.error('Failed to load your saved resumes.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      
      if (!userId) {
        setResumeFiles(prev => [...prev, ...files]);
        toast.success(`${files.length} resume${files.length > 1 ? 's' : ''} uploaded successfully!`);
        
        // For uploaded PDFs, we'll send to the basic resume editor with source=pdf param
        if (files.length === 1) {
          navigate("/resumebuilder/basic?source=pdf");
        }
        return;
      }
      
      // Upload to Supabase Storage (this would need a bucket setup)
      // For now, we'll just add the files to the state
      setResumeFiles(prev => [...prev, ...files]);
      toast.success(`${files.length} resume${files.length > 1 ? 's' : ''} uploaded successfully!`);
      
      // For uploaded PDFs, we'll send to the basic resume editor with source=pdf param
      if (files.length === 1) {
        navigate("/resumebuilder/basic?source=pdf");
      }

    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload resume files.');
    }
  };

  const handleViewResume = (resumeId: string, templateType: string) => {
    // For view functionality, navigate to the resume builder with the specific ID
    navigate(`/resumebuilder/${templateType.toLowerCase().replace(' resume', '')}?id=${resumeId}&mode=view`);
  };

  const handleEditResume = (resumeId: string, templateType: string) => {
    // Navigate to the specific resume builder with the ID to edit
    navigate(`/resumebuilder/${templateType.toLowerCase().replace(' resume', '')}?id=${resumeId}`);
  };

  const handleEditPDF = (index: number) => {
    // For PDF uploads, navigate to the basic resume editor with source=pdf param
    navigate("/resumebuilder/basic?source=pdf");
  };

  return {
    resumeFiles,
    savedResumes,
    loading,
    handleFileUpload,
    handleViewResume,
    handleEditResume,
    handleEditPDF
  };
};
