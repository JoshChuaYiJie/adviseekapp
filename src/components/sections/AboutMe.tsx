import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { MajorRecommendations } from "./majors/MajorRecommendations";
import { UserProfileDisplay } from "./majors/UserProfileDisplay";
import { AboutMeProps } from "./types";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

export const AboutMe = ({ user }: AboutMeProps) => {
  const { t } = useTranslation();
  const { isCurrentlyDark } = useTheme();
  const navigate = useNavigate(); // Add this line

  return (
    <div className={`space-y-6 w-full max-w-full ${isCurrentlyDark ? 'text-white' : ''}`}>
      <h2 className="text-2xl font-bold">{t("aboutMe.title")}</h2>

      {user && user.email && (
        <div className={`mb-6 p-6 rounded-lg shadow ${isCurrentlyDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className="text-xl font-medium mb-2">{t("aboutMe.profileInfo")}</h3>
          <p>{t("aboutMe.email")}: {user.email}</p>
        </div>
      )}

      <UserProfileDisplay
        riasecCode={user?.profile?.riasec_code}
        workValueCode={user?.profile?.work_value_code}
      />

      <div className={`p-6 rounded-lg shadow ${isCurrentlyDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-medium">{t("aboutMe.recommendedMajors")}</h3>
          <Button 
            variant="outline"
            size="sm"
            className="gap-2" 
            onClick={() => navigate('/recommendations')}
          >
            <Sparkles size={16} />
            {t("aboutMe.exploreMore")}
          </Button>
        </div>
        <MajorRecommendations
          riasecCode={user?.profile?.riasec_code}
          workValueCode={user?.profile?.work_value_code}
        />
      </div>
    </div>
  );
};
