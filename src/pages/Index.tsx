
import { useState } from "react";
import { Apple, Github, Mail, MoveRight } from "lucide-react";
import SocialLoginButton from "@/components/SocialLoginButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Index = () => {
  const [email, setEmail] = useState("");
  const [isEmailContinue, setIsEmailContinue] = useState(false);

  const handleSocialLogin = (provider: string) => {
    toast.info(`Please connect Supabase to enable ${provider} authentication`);
  };

  const handleEmailContinue = () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    
    if (!isEmailContinue) {
      setIsEmailContinue(true);
    } else {
      toast.info("Please connect Supabase to enable email authentication");
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
            <div className="h-10 w-10 rounded-full bg-primary-gradient flex items-center justify-center overflow-hidden">
              <img src="/lovable-uploads/91e13e22-0c4e-4bb8-be3b-a16cac3f5b22.png" alt="Logo" className="h-12 w-12 object-cover" />
            </div>
            <h1 className="font-bold text-xl">Radiant<span className="text-accent">.AI</span></h1>
          </div>

          {/* Auth Section */}
          <div className="space-y-8">
            <h2 className="text-lg font-semibold">Sign up or Login with</h2>

            {!isEmailContinue ? (
              <>
                {/* Social Login Buttons */}
                <div className="space-y-3">
                  <SocialLoginButton 
                    provider="Apple" 
                    icon={<Apple size={18} />} 
                    onClick={() => handleSocialLogin("Apple")}
                  />
                  <SocialLoginButton 
                    provider="Google" 
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>}
                    onClick={() => handleSocialLogin("Google")}
                  />
                  <SocialLoginButton 
                    provider="GitHub" 
                    icon={<Github size={18} />} 
                    onClick={() => handleSocialLogin("GitHub")}
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
                    className="bg-transparent border border-gray-700/20"
                  />
                </div>
                
                <Button 
                  onClick={() => toast.info("Please connect Supabase to enable authentication")}
                  className="w-full bg-primary-gradient text-white" 
                >
                  Continue
                </Button>
                
                <div className="text-xs text-gray-500 text-center">
                  By continuing, you agree to our 
                  <a href="#" className="text-accent hover:underline mx-1">Terms of Service</a> 
                  and 
                  <a href="#" className="text-accent hover:underline mx-1">Privacy Policy</a>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-auto pt-8">
          <div className="text-sm mb-4">Available now on iOS and Android</div>
          
          <div className="flex space-x-3">
            <a href="#" className="block">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                alt="App Store" 
                className="h-10"
              />
            </a>
            <a href="#" className="block">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                alt="Play Store" 
                className="h-10"
              />
            </a>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-4">
            <a href="#" className="hover:text-accent">Privacy Policy</a>
            <a href="#" className="hover:text-accent">Terms of Service</a>
          </div>
        </div>
      </div>
      
      {/* Right Side - Image */}
      <div className="hidden md:block md:w-7/12 lg:w-8/12 xl:w-2/3 bg-primary-gradient">
        <div className="h-full w-full relative overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1551651653-c5186a1fbba2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MXx8amVsbHlmaXNoJTIwZ2xvd2luZ3x8MHx8fHwxNjI0MzYwNDc0&ixlib=rb-4.0.3&q=80&w=1800" 
            alt="Glowing Jellyfish" 
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-4 right-4 text-white/80 text-xs">
            'Bioluminescent Ballet' by RadiantAI
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
