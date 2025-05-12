
import { useTheme } from "@/contexts/ThemeContext";
import { MajorProfileDisplay } from './types';

export const UserProfileDisplay = ({ riasecCode, workValueCode }: MajorProfileDisplay) => {
  const { isCurrentlyDark } = useTheme();

  // Add debug logging
  console.log("UserProfileDisplay - RIASEC code:", riasecCode);
  console.log("UserProfileDisplay - Work Values code:", workValueCode);

  return (
    <div className="mb-6">
      <h3 className="text-xl font-medium mb-2">Based on Your Profile</h3>
      <p className="text-gray-600 dark:text-gray-300">
        We've used your RIASEC code ({riasecCode || 'N/A'}) and Work Values code ({workValueCode || 'N/A'}) 
        to generate these major recommendations for you.
      </p>
    </div>
  );
};
