
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface EmailAuthFormProps {
  email: string;
  onBack: () => void;
}

const EmailAuthForm = ({ email, onBack }: EmailAuthFormProps) => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    try {
      // Try to sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          // Since we can't directly check if a user exists, we attempt to sign in
          // and use the error message to determine if the account exists
          toast.error("Invalid credentials. If you don't have an account, please sign up.", {
            action: {
              label: "Sign Up",
              onClick: handleSignUp,
            },
          });
        } else {
          toast.error(error.message);
        }
      } else if (data.user) {
        toast.success("Login successful!");
      }
    } catch (err) {
      toast.error(`An unexpected error occurred: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Sign up successful! Please check your email to verify your account.");
      }
    } catch (err) {
      toast.error(`An unexpected error occurred: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-accent hover:underline mb-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-180">
          <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>
      
      <div>
        <label className="text-sm font-medium">Email</label>
        <div className="flex items-center gap-2 mt-1 bg-black/5 px-3 py-2 rounded-md">
          <span>{email}</span>
          <button onClick={onBack} className="text-xs text-accent">
            Change
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Password</label>
        <Input 
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-transparent border border-gray-700/20"
        />
      </div>
      
      <div className="flex gap-3">
        <Button 
          onClick={handleEmailLogin}
          className="w-full bg-primary-gradient text-white"
          disabled={isLoading}
        >
          Login
        </Button>
        <Button 
          onClick={handleSignUp}
          variant="outline"
          className="w-full"
          disabled={isLoading}
        >
          Sign Up
        </Button>
      </div>
      
      <div className="text-xs text-gray-500 text-center">
        By continuing, you agree to our 
        <Link to="/terms-of-service" className="text-accent hover:underline mx-1">Terms of Service</Link> 
        and 
        <Link to="/privacy-policy" className="text-accent hover:underline mx-1">Privacy Policy</Link>
      </div>
    </div>
  );
};

export default EmailAuthForm;
