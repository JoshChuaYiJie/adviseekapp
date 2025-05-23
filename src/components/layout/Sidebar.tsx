
import { School, FileText, BookOpen, Video, DollarSign, Settings, Play, LogOut, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  id: string;
  tooltip: string;
  hidden?: boolean;
}

const getNavItems = (t: any): NavItem[] => [
  { 
    label: "About Me",
    icon: UserRound, 
    id: "about-me",
    tooltip: "Your profile and resume information"
  },
  { 
    label: t("navigation.applied_programmes"),
    icon: School, 
    id: "applied-programmes",
    tooltip: "View and manage your university applications"
  },
  { 
    label: t("navigation.apply_now"), 
    icon: BookOpen, 
    id: "apply-now",
    tooltip: "Start a new university application"
  },
  { 
    label: t("navigation.mock_interviews"), 
    icon: Video, 
    id: "mock-interviews",
    tooltip: "Practice with AI-generated interview questions"
  },
  { 
    label: t("navigation.get_paid"), 
    icon: DollarSign, 
    id: "get-paid",
    tooltip: "Earn money by helping others with their applications"
  },
  // Hide Community and Achievements sections
  { 
    label: t("navigation.community"), 
    icon: UserRound, 
    id: "community",
    tooltip: "Discuss and share your university experiences",
    hidden: true
  },
  { 
    label: t("navigation.achievements"), 
    icon: UserRound, 
    id: "achievements",
    tooltip: "View your badges and progress",
    hidden: true
  },
];

interface SidebarProps {
  selectedSection: string;
  setSelectedSection: (section: string) => void;
  user: any;
  onReplayTutorial?: () => void;
}

export const AppSidebar = ({ selectedSection, setSelectedSection, user, onReplayTutorial }: SidebarProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const navItems = getNavItems(t);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Successfully signed out");
    navigate("/");
  };
  
  const handleProfileSettings = () => {
    navigate("/settings");
  };

  return (
    <ShadcnSidebar>
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center">
          <span className="text-2xl font-bold text-foreground">Adviseek</span>
          <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-yellow-400 text-yellow-800 dark:bg-yellow-500 dark:text-yellow-900 rounded">
            FREE
          </span>
        </div>
      </div>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("navigation.title", "Navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.filter(item => !item.hidden).map((item) => (
                <SidebarMenuItem key={item.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        onClick={() => {
                          setSelectedSection(item.id);
                          if (item.id === "community") {
                            navigate("/community");
                          } else if (item.id === "achievements") {
                            navigate("/achievements");
                          }
                        }}
                        isActive={selectedSection === item.id}
                        data-id={item.id}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.tooltip}</TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-gray-200 dark:border-gray-800">
        <div className="p-4 space-y-2">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2">
                      {user.email?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 text-left overflow-hidden">
                      <div className="font-medium truncate">{user.email}</div>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onSelect={handleProfileSettings}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t("settings.profile")}</span>
                </DropdownMenuItem>
                {onReplayTutorial && (
                  <DropdownMenuItem onSelect={onReplayTutorial}>
                    <Play className="mr-2 h-4 w-4" />
                    <span>{t("settings.replay_tutorial")}</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button 
            onClick={() => navigate("/pricing")} 
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 rounded-md"
            data-tutorial="upgrade-button"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 11l5-5 5 5"/>
              <path d="M7 17l5-5 5 5"/>
            </svg>
            {t("upgrade")}
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </ShadcnSidebar>
  );
};
