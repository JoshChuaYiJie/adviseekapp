
import { Button } from "@/components/ui/button";
import { Eye, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

interface ResumeTableProps {
  loading: boolean;
  savedResumes: SavedResume[];
  resumeFiles: File[];
  onViewResume: (resumeId: string, templateType: string) => void;
  onEditResume: (resumeId: string, templateType: string) => void;
  onEditPDF: (index: number) => void;
}

export interface SavedResume {
  id: string;
  name: string | null;
  template_type: string;
  updated_at: string;
}

export const ResumeTable = ({ 
  loading, 
  savedResumes, 
  resumeFiles, 
  onViewResume, 
  onEditResume, 
  onEditPDF 
}: ResumeTableProps) => {
  const navigate = useNavigate();
  const { isCurrentlyDark } = useTheme();

  return (
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
                Resume Name
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
                        onClick={() => onViewResume(resume.id, resume.template_type)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onEditResume(resume.id, resume.template_type)}
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
                        onClick={() => navigate("/resumebuilder/basic?source=pdf")}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onEditPDF(index)}
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
  );
};
