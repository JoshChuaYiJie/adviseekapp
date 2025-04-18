
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { FileUp, FilePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const MyResume = () => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const navigate = useNavigate();

  // Sample resume data (in a real app, this would come from a database)
  const existingResumes = [
    { id: 1, name: "Harvard Business School.pdf", program: "Harvard MBA", updatedAt: "2024-04-02" },
    { id: 2, name: "Stanford GSB.pdf", program: "Stanford MBA", updatedAt: "2024-04-01" },
    { id: 3, name: "MIT Sloan.pdf", program: "MIT MS Finance", updatedAt: "2024-03-28" },
  ];

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
      setResumeFiles(prev => [...prev, ...pdfFiles]);
      toast.success(`${pdfFiles.length} resume${pdfFiles.length > 1 ? 's' : ''} uploaded successfully!`);
    } else {
      toast.error("Please upload PDF files only.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setResumeFiles(prev => [...prev, ...fileArray]);
      toast.success(`${fileArray.length} resume${fileArray.length > 1 ? 's' : ''} uploaded successfully!`);
    }
  };

  const handleBuildResume = () => {
    navigate("/resumebuilder");
  };

  return (
    <div className="space-y-6">
      {/* Upload Resume Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          className={`p-6 border-2 border-dashed ${
            isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
          } rounded-lg flex flex-col items-center justify-center text-center h-64`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-tutorial="drop-resume"
        >
          <FileUp className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Upload Your Resume</h3>
          <p className="text-sm text-gray-500 mb-4">
            Drag and drop your PDF resume here or click to browse
          </p>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileUpload}
              multiple
            />
            <Button variant="outline" size="sm">
              Browse Files
            </Button>
          </label>
        </Card>

        <Card
          className="p-6 border rounded-lg flex flex-col items-center justify-center text-center h-64"
          data-tutorial="build-resume"
        >
          <FilePlus className="h-12 w-12 text-blue-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Build Your Resume</h3>
          <p className="text-sm text-gray-500 mb-4">
            Create a professional resume with our templates and AI assistance
          </p>
          <Button onClick={handleBuildResume}>Build Now</Button>
        </Card>
      </div>

      {/* Resume List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Your Resumes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Program
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Last Updated
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {existingResumes.map((resume) => (
                <tr key={resume.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {resume.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {resume.program}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {resume.updatedAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
              {resumeFiles.map((file, index) => (
                <tr key={`uploaded-${index}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {file.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Not assigned
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Just now
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
