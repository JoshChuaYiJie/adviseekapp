
import { Link } from "react-router-dom";

interface AuthFooterProps {
  mode?: "signin" | "signup";
  onToggleMode?: () => void;
}

const AuthFooter = ({ mode, onToggleMode }: AuthFooterProps) => {
  return (
    <div className="mt-auto pt-8">
      {mode && onToggleMode && (
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={onToggleMode} 
              className="text-blue-600 hover:underline font-medium"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      )}
      
      <div className="flex justify-between text-xs text-gray-500 mt-4">
        <Link to="/privacy-policy" className="hover:text-accent">Privacy Policy</Link>
        <Link to="/terms-of-service" className="hover:text-accent">Terms of Service</Link>
      </div>
    </div>
  );
};

export default AuthFooter;
