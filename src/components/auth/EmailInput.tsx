
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";

interface EmailInputProps {
  email: string;
  setEmail: (email: string) => void;
  onContinue: () => void;
  isLoading: boolean;
}

const EmailInput = ({ email, setEmail, onContinue, isLoading }: EmailInputProps) => {
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleContinue = () => {
    if (!email) {
      setEmailError("Email is required");
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    
    setEmailError("");
    onContinue();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
            }}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        {emailError && (
          <p className="text-sm text-red-500">{emailError}</p>
        )}
      </div>
      
      <Button 
        onClick={handleContinue}
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Continue"}
      </Button>
      
      <p className="text-xs text-gray-500 text-center">
        By continuing, you agree to our Terms and Conditions and Privacy Policy, and to receive our newsletter, updates, and exclusive offers. You can unsubscribe at any time.
      </p>
    </div>
  );
};

export default EmailInput;
