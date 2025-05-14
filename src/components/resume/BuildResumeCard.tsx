
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const BuildResumeCard = () => {
  const navigate = useNavigate();
  const { isCurrentlyDark } = useTheme();
  const { t } = useTranslation();
  
  const handleBuildResume = async () => {
    try {
      // Check if user is authenticated
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast.error("You must be logged in to create a resume");
        return;
      }
      
      // Create a new resume entry in the database
      const { data, error } = await supabase
        .from('resumes')
        .insert({
          user_id: session.session.user.id,
          name: "New Resume",
          template_type: "basic"
        })
        .select();
      
      if (error) {
        console.error("Error creating resume:", error);
        toast.error("Failed to create resume");
        return;
      }
      
      // Navigate to the resume builder with the newly created resume ID
      if (data && data.length > 0) {
        navigate(`/resumebuilder?id=${data[0].id}`);
      } else {
        navigate("/resumebuilder");
      }
    } catch (error) {
      console.error("Error in handleBuildResume:", error);
      toast.error("Something went wrong. Please try again.");
      // Fallback to default behavior
      navigate("/resumebuilder?name=Default NUS Resume");
    }
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
