
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
  icon: React.ComponentType;
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
}

export const AppSidebar = ({ selectedSection, setSelectedSection }: SidebarProps) => {
  const navigate = useNavigate();

  return (
    <ShadcnSidebar>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <span className="text-2xl font-bold text-purple-600">Adviseek</span>
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
    </ShadcnSidebar>
  );
};
