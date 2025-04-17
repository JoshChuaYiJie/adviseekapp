
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
        <DropdownMenuItem onClick={handleSignOut}>
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
