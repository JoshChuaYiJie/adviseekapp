
import { Link } from "react-router-dom";

const AuthFooter = () => {
  return (
    <div className="mt-auto pt-8">
      <div className="flex justify-between text-xs text-gray-500 mt-4">
        <Link to="/privacy-policy" className="hover:text-accent">Privacy Policy</Link>
        <Link to="/terms-of-service" className="hover:text-accent">Terms of Service</Link>
      </div>
    </div>
  );
};

export default AuthFooter;
