
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SocialLoginButton from "@/components/SocialLoginButton";
import { useToast } from "@/hooks/use-toast";

interface SocialAuthOptionsProps {
  onEmailContinue?: () => void;
}

const SocialAuthOptions = ({ onEmailContinue }: SocialAuthOptionsProps) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(provider);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as "google" | "github" | "twitter",
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });

      if (error) {
        toast({
          title: "Sign in error",
          description: error.message,
          variant: "destructive",
        });
      }

      if (data) {
        navigate("/"); // Redirect to home page after successful login
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-2">
      <SocialLoginButton
        provider="google"
        onClick={() => handleSocialLogin("google")}
        disabled={isLoading !== null}
      >
        {isLoading === "google" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          "Google"
        )}
      </SocialLoginButton>

      <SocialLoginButton
        provider="github"
        onClick={() => handleSocialLogin("github")}
        disabled={isLoading !== null}
      >
        {isLoading === "github" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          "GitHub"
        )}
      </SocialLoginButton>

      <SocialLoginButton
        provider="twitter"
        onClick={() => handleSocialLogin("twitter")}
        disabled={isLoading !== null}
      >
        {isLoading === "twitter" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          "Twitter"
        )}
      </SocialLoginButton>

      {onEmailContinue && (
        <SocialLoginButton
          provider="email"
          onClick={onEmailContinue}
          disabled={isLoading !== null}
        >
          Continue with Email
        </SocialLoginButton>
      )}
    </div>
  );
};

export default SocialAuthOptions;
