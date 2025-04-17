
import React from "react";
import { cn } from "@/lib/utils";
import { FaGoogle, FaGithub, FaTwitter, FaEnvelope } from "react-icons/fa";

interface SocialLoginButtonProps {
  provider: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const SocialLoginButton = ({ 
  provider, 
  onClick, 
  disabled,
  className,
  children
}: SocialLoginButtonProps) => {
  // Get the appropriate icon based on provider
  const getIcon = () => {
    switch (provider.toLowerCase()) {
      case 'google':
        return <FaGoogle className="h-5 w-5" />;
      case 'github':
        return <FaGithub className="h-5 w-5" />;
      case 'twitter':
        return <FaTwitter className="h-5 w-5" />;
      case 'email':
        return <FaEnvelope className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-700/20 bg-black/5 hover:bg-black/10 text-sm font-medium transition-all",
        className
      )}
    >
      {getIcon()}
      {children || provider}
    </button>
  );
};

export default SocialLoginButton;
