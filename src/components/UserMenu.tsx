
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Instagram, MessageCircle } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface UserMenuProps {
  user: User;
}

const UserMenu = ({ user }: UserMenuProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/authorization");
  };

  return (
    <div className="space-y-3">
      {/* Follow us section */}
      <div className="px-3 py-2">
        <p className="text-xs text-gray-500 mb-2">Follow us on</p>
        <div className="flex space-x-3">
          <a 
            href="https://instagram.com/adviseek.official" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Instagram className="w-4 h-4 text-gray-600" />
          </a>
          <a 
            href="https://t.me/adviseek" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-gray-600" />
          </a>
        </div>
      </div>

      {/* User menu */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">
            <div className="flex-1 text-left">
              <div className="font-medium">{user.email}</div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => navigate("/privacy-policy")}>
            Privacy Policy
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/terms-of-service")}>
            Terms of Service
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/contact")}>
            Contact Us
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            Account Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserMenu;
