
import { useState } from "react";
import EmailAuthForm from "./EmailAuthForm";
import SocialAuthOptions from "./SocialAuthOptions";
import AuthHeader from "./AuthHeader";
import AuthFooter from "./AuthFooter";
import CountdownTimer from "./CountdownTimer";

const AuthSection = () => {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [email, setEmail] = useState("");

  const toggleAuthMode = () => {
    setAuthMode(authMode === "signin" ? "signup" : "signin");
  };

  const handleEmailContinue = () => {
    setShowEmailAuth(true);
  };

  const handleBackToOptions = () => {
    setShowEmailAuth(false);
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-col justify-center w-full lg:w-1/2 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <AuthHeader />
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {showEmailAuth ? (
              <EmailAuthForm 
                mode={authMode} 
                onBack={handleBackToOptions} 
              />
            ) : (
              <>
                <EmailAuthForm mode={authMode} />
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <SocialAuthOptions onEmailContinue={handleEmailContinue} />
                  </div>
                </div>
              </>
            )}
          </div>
          <AuthFooter
            mode={authMode}
            onToggleMode={toggleAuthMode}
          />
        </div>
      </div>
      
      {/* Right side with countdown timer */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-50 items-center justify-center p-12">
        <div className="max-w-md w-full">
          <CountdownTimer />
        </div>
      </div>
    </div>
  );
};

export default AuthSection;
