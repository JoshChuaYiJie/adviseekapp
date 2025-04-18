
import { School, FileText, BookOpen, Video, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
} from "@/components/ui/sidebar";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  id: string;
}

const navItems: NavItem[] = [
  { label: "Applied Programmes", icon: School, id: "applied-programmes" },
  { label: "My Resume", icon: FileText, id: "my-resume" },
  { label: "Apply Now", icon: BookOpen, id: "apply-now" },
  { label: "Mock Interviews", icon: Video, id: "mock-interviews" },
  { label: "Get Paid", icon: DollarSign, id: "get-paid" },
];

interface SidebarProps {
  selectedSection: string;
  setSelectedSection: (section: string) => void;
  user: any;
}

export const AppSidebar = ({ selectedSection, setSelectedSection, user }: SidebarProps) => {
  const navigate = useNavigate();

  return (
    <ShadcnSidebar>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <span className="text-2xl font-bold text-black">Adviseek</span>
          <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-yellow-400 text-yellow-800 rounded">
            FREE
          </span>
        </div>
      </div>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setSelectedSection(item.id)}
                    isActive={selectedSection === item.id}
                    data-id={item.id}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-gray-200">
        <div className="p-4 space-y-2">
          {user && (
            <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md">
              <div className="flex-1 text-left">
                <div className="font-medium">{user.email}</div>
              </div>
            </div>
          )}
          <button 
            onClick={() => navigate("/pricing")} 
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
            data-tutorial="upgrade-button"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 11l5-5 5 5"/>
              <path d="M7 17l5-5 5 5"/>
            </svg>
            Upgrade
          </button>
        </div>
      </SidebarFooter>
    </ShadcnSidebar>
  );
};
