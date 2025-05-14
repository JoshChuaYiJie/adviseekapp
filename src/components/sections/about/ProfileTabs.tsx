
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface ProfileTabsProps {
  activeTab: "quiz" | "profile" | "resume";
  setActiveTab: (tab: "quiz" | "profile" | "resume") => void;
}

export const ProfileTabs = ({ activeTab, setActiveTab }: ProfileTabsProps) => {
  return (
    <div className="flex space-x-2">
      <Button 
        variant={activeTab === "quiz" ? "default" : "outline"} 
        onClick={() => setActiveTab("quiz")}
      >
        Quizzes
      </Button>
      <Button 
        variant={activeTab === "profile" ? "default" : "outline"} 
        onClick={() => setActiveTab("profile")}
      >
        My Profile
      </Button>
      <Button 
        variant={activeTab === "resume" ? "default" : "outline"} 
        onClick={() => setActiveTab("resume")}
      >
        <FileText className="mr-2 h-4 w-4" />
        My Resume
      </Button>
    </div>
  );
};
