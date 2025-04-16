
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface EmailInputProps {
  email: string;
  setEmail: (email: string) => void;
  onContinue: () => void;
  isLoading: boolean;
}

const EmailInput = ({ email, setEmail, onContinue, isLoading }: EmailInputProps) => {
  const handleEmailContinue = () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    onContinue();
  };
  
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Email</label>
      <Input 
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="name@example.com"
        className="bg-transparent border border-gray-700/20"
      />
      <Button 
        onClick={handleEmailContinue}
        className="w-full bg-primary-gradient text-white"
        disabled={isLoading}
      >
        Continue
      </Button>
      
      <div className="text-center">
        <a href="#" className="text-sm text-accent hover:underline">Need help?</a>
      </div>
    </div>
  );
};

export default EmailInput;
