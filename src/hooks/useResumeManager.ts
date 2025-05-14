
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { SavedResume } from "@/components/resume/ResumeTable";
import { formatTemplateType } from "@/utils/resumeHelpers";

export const useResumeManager = () => {
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  // Check for authenticated user and set user state
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);

  // Fetch saved resumes from Supabase when user is authenticated
  useEffect(() => {
    if (user) {
      fetchSavedResumes();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSavedResumes = async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('resumes')
        .select('id, name, template_type, updated_at')
        .eq('user_id', user.id)
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
    } catch (error) {
      console.error('Error fetching saved resumes:', error);
      toast.error('Failed to load your saved resumes.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    try {
      if (!user) {
        setResumeFiles(prev => [...prev, ...files]);
        toast.warning("Sign in to save your resume permanently", {
          description: "Your resume data will be temporary until you sign in"
        });
        
        // For uploaded PDFs, we'll send to the basic resume editor with source=pdf param
        if (files.length === 1) {
          navigate("/resumebuilder/basic?source=pdf");
        }
        return;
      }
      
      // For authenticated users, we'll add the files to state and also upload to Supabase Storage
      // (Note: This would require a Storage bucket setup, which we're omitting for now)
      setResumeFiles(prev => [...prev, ...files]);
      
      // For each uploaded file, we'll create a basic resume entry
      if (files.length === 1) {
        const file = files[0];
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension
        
        // Create a resume entry in the database
        const { data, error } = await supabase
          .from('resumes')
          .insert({
            name: fileName,
            user_id: user.id,
            template_type: 'basic',
          })
          .select('id')
          .single();
          
        if (error) {
          console.error('Error creating resume entry:', error);
          toast.error('Failed to create resume entry.');
        } else {
          // Navigate to resume editor with the ID
          navigate(`/resumebuilder/basic?id=${data.id}&source=pdf`);
          return;
        }
      }
      
      toast.success(`${files.length} resume${files.length > 1 ? 's' : ''} uploaded successfully!`);
      
      // Fallback navigation if we couldn't create the entry
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
