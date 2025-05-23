import {
  ChevronsUpDown,
  GalleryVerticalEnd,
  Instagram,
  Send,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

interface AppSidebarProps {
  selectedSection: string;
  setSelectedSection: (section: string) => void;
  user: any;
  onReplayTutorial: () => void;
}

export function AppSidebar({ selectedSection, setSelectedSection, user, onReplayTutorial }: AppSidebarProps) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const { setTheme, isCurrentlyDark } = useTheme();

  const items = [
    {
      title: 'About Me',
      icon: () => <GalleryVerticalEnd className="h-4 w-4" />,
      url: '#about-me',
    },
    {
      title: 'Applied Programmes',
      icon: () => <GalleryVerticalEnd className="h-4 w-4" />,
      url: '#applied-programmes',
    },
    {
      title: 'Apply Now',
      icon: () => <GalleryVerticalEnd className="h-4 w-4" />,
      url: '#apply-now',
    },
    {
      title: 'Mock Interviews',
      icon: () => <GalleryVerticalEnd className="h-4 w-4" />,
      url: '#mock-interviews',
    },
    {
      title: 'Get Paid',
      icon: () => <GalleryVerticalEnd className="h-4 w-4" />,
      url: '#get-paid',
    },
  ];

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2 cursor-pointer" data-tutorial="adviseek-logo">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Adviseek</span>
                  <span className="truncate text-xs">Your AI Career Guide</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  tooltip={item.title}
                  onClick={() => setSelectedSection(item.url.replace('#', ''))}
                  isActive={selectedSection === item.url.replace('#', '')}
                  data-id={item.url.replace('#', '')}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Follow us on section */}
        <SidebarGroup data-tutorial="follow-us">
          <SidebarGroupLabel>Follow us on</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a 
                  href="https://instagram.com/adviseek" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Instagram className="h-4 w-4" />
                  <span>Instagram</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a 
                  href="https://t.me/adviseek" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Telegram</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  data-tutorial="user-profile"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.email || 'User'}</span>
                    <span className="truncate text-xs">Student</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={onReplayTutorial}>
                  Replay Tutorial
                  <DropdownMenuShortcut>⌘T</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme(isCurrentlyDark ? 'light' : 'dark')}>
                  {isCurrentlyDark ? 'Light' : 'Dark'}
                  <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  Settings
                  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
