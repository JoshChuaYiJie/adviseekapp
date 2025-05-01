
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { FileUp, FilePlus, Eye, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";

interface SavedResume {
  id: string;
  name: string;
  template_type: string;
  updated_at: string;
}

export const MyResume = () => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isCurrentlyDark } = useTheme();

  // Fetch saved resumes from Supabase
  useEffect(() => {
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
              name: resume.name || 'Untitled Resume',
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
    
    fetchSavedResumes();
  }, []);

  // Format template type for display
  const formatTemplateType = (templateType: string) => {
    switch (templateType) {
      case 'basic': return 'Basic Resume';
      case 'stem': return 'STEM Resume';
      case 'business': return 'Business Resume';
      case 'humanities': return 'Humanities Resume';
      case 'creative': return 'Creative Arts Resume';
      case 'health': return 'Health Sciences Resume';
      case 'education': return 'Education/Public Service Resume';
      default: return templateType.charAt(0).toUpperCase() + templateType.slice(1);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const pdfFiles = droppedFiles.filter(file => file.type === "application/pdf");
    
    if (pdfFiles.length > 0) {
      handleFileUpload(pdfFiles);
    } else {
      toast.error("Please upload PDF files only.");
    }
  };

  const handleBrowseFiles = () => {
    // This will trigger the hidden file input
    document.getElementById('resume-file-upload')?.click();
  };

  const handleInputFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      handleFileUpload(fileArray);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      
      if (!userId) {
        setResumeFiles(prev => [...prev, ...files]);
        toast.success(`${files.length} resume${files.length > 1 ? 's' : ''} uploaded successfully!`);
        return;
      }
      
      // Upload to Supabase Storage (this would need a bucket setup)
      // For now, we'll just add the files to the state
      setResumeFiles(prev => [...prev, ...files]);
      toast.success(`${files.length} resume${files.length > 1 ? 's' : ''} uploaded successfully!`);

    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload resume files.');
    }
  };

  const handleBuildResume = () => {
    navigate("/resumebuilder");
  };

  const handleViewResume = (resumeId: string, templateType: string) => {
    // For view functionality, we'll navigate to the resume builder with the specific ID
    // The actual viewing logic would be implemented in the resume builder page
    navigate(`/resumebuilder/${templateType.toLowerCase().replace(' resume', '')}?id=${resumeId}&mode=view`);
  };

  const handleEditResume = (resumeId: string, templateType: string) => {
    // Navigate to the specific resume builder with the ID to edit
    navigate(`/resumebuilder/${templateType.toLowerCase().replace(' resume', '')}?id=${resumeId}`);
  };

  return (
    <div className="space-y-6">
      {/* Upload Resume Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          className={`p-6 border-2 border-dashed ${
            isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600"
          } rounded-lg flex flex-col items-center justify-center text-center h-64 dark:bg-gray-800`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-tutorial="drop-resume"
        >
          <FileUp className={`h-12 w-12 ${isCurrentlyDark ? "text-gray-300" : "text-gray-400"} mb-4`} />
          <h3 className="text-lg font-medium mb-2">Upload Your Resume</h3>
          <p className={`text-sm ${isCurrentlyDark ? "text-gray-300" : "text-gray-500"} mb-4`}>
            Drag and drop your PDF resume here or click to browse
          </p>
          <Button variant="outline" size="sm" onClick={handleBrowseFiles}>
            Browse Files
          </Button>
          <input
            id="resume-file-upload"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleInputFileChange}
            multiple
          />
        </Card>

        <Card
          className={`p-6 border rounded-lg flex flex-col items-center justify-center text-center h-64 ${
            isCurrentlyDark ? "border-gray-700 bg-gray-800" : ""
          }`}
          data-tutorial="build-resume"
        >
          <FilePlus className="h-12 w-12 text-blue-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Build Your Resume</h3>
          <p className={`text-sm ${isCurrentlyDark ? "text-gray-300" : "text-gray-500"} mb-4`}>
            Create a professional resume with our templates and AI assistance
          </p>
          <Button onClick={handleBuildResume}>Build Now</Button>
        </Card>
      </div>

      {/* Resume List */}
      <div className={`${isCurrentlyDark ? "bg-gray-800" : "bg-white"} p-6 rounded-lg shadow`}>
        <h3 className="text-lg font-medium mb-4">Your Resumes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={isCurrentlyDark ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                <th
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium ${
                    isCurrentlyDark ? "text-gray-300" : "text-gray-500"
                  } uppercase tracking-wider`}
                >
                  Name
                </th>
                <th
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium ${
                    isCurrentlyDark ? "text-gray-300" : "text-gray-500"
                  } uppercase tracking-wider`}
                >
                  Type
                </th>
                <th
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium ${
                    isCurrentlyDark ? "text-gray-300" : "text-gray-500"
                  } uppercase tracking-wider`}
                >
                  Last Updated
                </th>
                <th
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium ${
                    isCurrentlyDark ? "text-gray-300" : "text-gray-500"
                  } uppercase tracking-wider`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`${isCurrentlyDark ? "bg-gray-800" : "bg-white"} divide-y ${
              isCurrentlyDark ? "divide-gray-700" : "divide-gray-200"
            }`}>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
                    </div>
                  </td>
                </tr>
              ) : savedResumes.length === 0 && resumeFiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">
                    No resumes found. Upload a PDF or build a new resume!
                  </td>
                </tr>
              ) : (
                <>
                  {savedResumes.map((resume) => (
                    <tr key={resume.id}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        isCurrentlyDark ? "text-gray-200" : "text-gray-900"
                      }`}>
                        {resume.name}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isCurrentlyDark ? "text-gray-300" : "text-gray-500"
                      }`}>
                        {resume.template_type}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isCurrentlyDark ? "text-gray-300" : "text-gray-500"
                      }`}>
                        {resume.updated_at}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isCurrentlyDark ? "text-gray-300" : "text-gray-500"
                      } space-x-2`}>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewResume(resume.id, resume.template_type)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditResume(resume.id, resume.template_type)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {resumeFiles.map((file, index) => (
                    <tr key={`uploaded-${index}`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        isCurrentlyDark ? "text-gray-200" : "text-gray-900"
                      }`}>
                        {file.name}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isCurrentlyDark ? "text-gray-300" : "text-gray-500"
                      }`}>
                        PDF Upload
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isCurrentlyDark ? "text-gray-300" : "text-gray-500"
                      }`}>
                        Just now
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isCurrentlyDark ? "text-gray-300" : "text-gray-500"
                      } space-x-2`}>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
