
import { useTheme } from "@/contexts/ThemeContext";
import { MajorProfileDisplay } from './types';

export const UserProfileDisplay = ({ riasecCode, workValueCode }: MajorProfileDisplay) => {
  const { isCurrentlyDark } = useTheme();

  // Add debug logging
  console.log("UserProfileDisplay - Displaying RIASEC code:", riasecCode);
  console.log("UserProfileDisplay - Displaying Work Values code:", workValueCode);

  return (
    <div className="mb-6">
      <h3 className="text-xl font-medium mb-2">Based on Your Profile</h3>
      <div className="flex flex-wrap gap-4 mb-4">
        <div className={`p-3 rounded-lg ${isCurrentlyDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className="text-sm font-medium">Your RIASEC Code:</p>
          <p className="text-lg font-bold">{riasecCode || 'N/A'}</p>
        </div>
        <div className={`p-3 rounded-lg ${isCurrentlyDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className="text-sm font-medium">Your Work Values Code:</p>
          <p className="text-lg font-bold">{workValueCode || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};
