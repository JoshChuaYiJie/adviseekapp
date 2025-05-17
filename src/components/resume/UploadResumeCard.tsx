
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileUp } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

interface UploadResumeCardProps {
  onFileUpload: (file: File) => void;
}

export const UploadResumeCard = ({ onFileUpload }: UploadResumeCardProps) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const { isCurrentlyDark } = useTheme();

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
      onFileUpload(pdfFiles[0]);
    } else {
      toast.error("Please upload PDF files only.");
    }
  };

  const handleBrowseFiles = () => {
    document.getElementById('resume-file-upload')?.click();
  };

  const handleInputFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  return (
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
      />
    </Card>
  );
};
