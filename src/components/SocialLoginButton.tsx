
import React from "react";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";

interface SocialLoginButtonProps {
  provider: string;
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const SocialLoginButton = ({ 
  provider, 
  icon, 
  onClick, 
  className 
}: SocialLoginButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-700/20 bg-black/5 hover:bg-black/10 text-sm font-medium transition-all",
        className
      )}
    >
      {icon}
      {provider}
    </button>
  );
};

export default SocialLoginButton;
