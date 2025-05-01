
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

export const BuildResumeCard = () => {
  const navigate = useNavigate();
  const { isCurrentlyDark } = useTheme();
  
  const handleBuildResume = () => {
    navigate("/resumebuilder");
  };

  return (
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
  );
};
