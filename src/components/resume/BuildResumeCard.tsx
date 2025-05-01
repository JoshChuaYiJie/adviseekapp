
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";

export const BuildResumeCard = () => {
  const navigate = useNavigate();
  const { isCurrentlyDark } = useTheme();
  const { t } = useTranslation();
  
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
      <h3 className="text-lg font-medium mb-2">{t("resume.build_title", "Build Your Resume")}</h3>
      <p className={`text-sm ${isCurrentlyDark ? "text-gray-300" : "text-gray-500"} mb-4`}>
        {t("resume.build_description", "Create a professional resume with our templates and AI assistance")}
      </p>
      <Button onClick={handleBuildResume}>{t("resume.build_button", "Build Now")}</Button>
    </Card>
  );
};
