
import { useState } from "react";
import { Github, Linkedin, Mail, MoveRight } from "lucide-react";
import { Link } from "react-router-dom";
import SocialLoginButton from "@/components/SocialLoginButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import InteractiveLogo from "@/components/InteractiveLogo";
import ImageCarousel from "@/components/ImageCarousel";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailContinue, setIsEmailContinue] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const carouselImages = [
    {
      src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1800&q=80",
      alt: "Singapore University Campus"
    },
    {
      src: "https://images.unsplash.com/photo-1596005554384-d293674c91d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1800&q=80",
      alt: "Singapore Modern Architecture"
    },
    {
      src: "https://images.unsplash.com/photo-1565967511849-76a60a516170?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1800&q=80", 
      alt: "Singapore Student Life"
    },
    {
      src: "https://images.unsplash.com/photo-1574236170880-28803ab57f4d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1800&q=80",
      alt: "Singapore City Skyline"
    }
  ];

  const handleSocialLogin = async (provider: 'github' | 'google' | 'linkedin_oidc') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      
      if (error) {
        toast.error(`Failed to sign in with ${provider}: ${error.message}`);
      }
    } catch (err) {
      toast.error(`An unexpected error occurred: ${(err as Error).message}`);
    }
  };

  const handleEmailContinue = () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    
    if (!isEmailContinue) {
      setIsEmailContinue(true);
    } else {
      handleEmailLogin();
    }
  };

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
          // Check if user exists
          const { data: userExists } = await supabase.auth.admin.getUserByEmail(email);
          
          if (userExists) {
            toast.error("Invalid password. Please try again.");
          } else {
            toast.error("Account doesn't exist. Would you like to sign up instead?", {
              action: {
                label: "Sign Up",
                onClick: handleSignUp,
              },
            });
          }
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

  const handleBack = () => {
    setIsEmailContinue(false);
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden">
      {/* Left Side - Auth */}
      <div className="w-full md:w-5/12 lg:w-4/12 xl:w-1/3 flex flex-col justify-between p-6 md:p-10 lg:p-12 bg-black/5">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <InteractiveLogo 
              src="/lovable-uploads/91e13e22-0c4e-4bb8-be3b-a16cac3f5b22.png" 
              alt="Adviseek Logo" 
              className="h-10 w-10 rounded-full overflow-hidden" 
            />
            <h1 className="font-bold text-xl">Adviseek<span className="text-accent">.SG</span></h1>
          </div>

          {/* Auth Section */}
          <div className="space-y-8">
            <h2 className="text-lg font-semibold">Sign up or Login with</h2>

            {!isEmailContinue ? (
              <>
                {/* Social Login Buttons */}
                <div className="space-y-3">
                  <SocialLoginButton 
                    provider="Google" 
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>} 
                    onClick={() => handleSocialLogin("google")}
                  />
                  <SocialLoginButton 
                    provider="GitHub" 
                    icon={<Github size={18} />} 
                    onClick={() => handleSocialLogin("github")}
                  />
                  <SocialLoginButton 
                    provider="LinkedIn" 
                    icon={<Linkedin size={18} />} 
                    onClick={() => handleSocialLogin("linkedin_oidc")}
                  />
                  <SocialLoginButton 
                    provider="Continue with Email" 
                    icon={<Mail size={18} />} 
                    onClick={() => setIsEmailContinue(true)}
                  />
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300/30"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-black/5 px-4 text-xs text-gray-500">OR</span>
                  </div>
                </div>

                {/* Email Input */}
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
                </div>

                {/* Help Link */}
                <div className="text-center">
                  <a href="#" className="text-sm text-accent hover:underline">Need help?</a>
                </div>
              </>
            ) : (
              /* Email Login/Signup Form */
              <div className="space-y-4">
                <button onClick={handleBack} className="flex items-center gap-1 text-sm text-accent hover:underline mb-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-180">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back
                </button>
                
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <div className="flex items-center gap-2 mt-1 bg-black/5 px-3 py-2 rounded-md">
                    <span>{email}</span>
                    <button onClick={() => setIsEmailContinue(false)} className="text-xs text-accent">
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
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-auto pt-8">
          <div className="flex justify-between text-xs text-gray-500 mt-4">
            <Link to="/privacy-policy" className="hover:text-accent">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-accent">Terms of Service</Link>
          </div>
        </div>
      </div>
      
      {/* Right Side - Image Carousel */}
      <div className="hidden md:block md:w-7/12 lg:w-8/12 xl:w-2/3 bg-primary-gradient">
        <div className="h-full w-full relative overflow-hidden">
          <ImageCarousel images={carouselImages} />
        </div>
      </div>
    </div>
  );
};

export default Index;
