
import { useState } from "react";
import AuthHeader from "./AuthHeader";
import SocialAuthOptions from "./SocialAuthOptions";
import EmailInput from "./EmailInput";
import EmailAuthForm from "./EmailAuthForm";
import AuthFooter from "./AuthFooter";

const AuthSection = () => {
  const [email, setEmail] = useState("");
  const [isEmailContinue, setIsEmailContinue] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="w-full md:w-5/12 lg:w-4/12 xl:w-1/3 flex flex-col justify-between p-6 md:p-10 lg:p-12 bg-black/5">
      <div>
        {/* Logo */}
        <AuthHeader />

        {/* Auth Section */}
        <div className="space-y-8">
          <h2 className="text-lg font-semibold">Sign up or Login with</h2>

          {!isEmailContinue ? (
            <>
              {/* Social Login Buttons */}
              <SocialAuthOptions onEmailContinue={() => setIsEmailContinue(true)} />

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
              <EmailInput
                email={email}
                setEmail={setEmail}
                onContinue={() => setIsEmailContinue(true)}
                isLoading={isLoading}
              />
            </>
          ) : (
            /* Email Login/Signup Form */
            <EmailAuthForm 
              email={email} 
              onBack={() => setIsEmailContinue(false)} 
              mode="signin"  // Add the required mode property with a default value
            />
          )}
        </div>
      </div>
      
      {/* Footer */}
      <AuthFooter />
    </div>
  );
};

export default AuthSection;
