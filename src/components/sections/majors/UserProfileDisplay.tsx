
import { useTheme } from "@/contexts/ThemeContext";
import { MajorProfileDisplay } from './types';

export const UserProfileDisplay = ({ riasecCode, workValueCode }: MajorProfileDisplay) => {
  const { isCurrentlyDark } = useTheme();

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg mb-6 w-full">
      <h3 className="text-xl font-medium mb-4">Your Profile Summary</h3>
      
      <div className="flex flex-wrap gap-4">
        {riasecCode && (
          <div className="p-4 rounded-lg bg-white dark:bg-gray-700 shadow flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Your RIASEC Code:</p>
            <p className="text-2xl font-bold">{riasecCode || 'N/A'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Based on your interests & competence</p>
          </div>
        )}
        
        {workValueCode && (
          <div className="p-4 rounded-lg bg-white dark:bg-gray-700 shadow flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Your Work Values Code:</p>
            <p className="text-2xl font-bold">{workValueCode || 'N/A'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Based on your work preferences</p>
          </div>
        )}
      </div>
      
      {(!riasecCode && !workValueCode) && (
        <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900 dark:border-amber-800 text-amber-800 dark:text-amber-200">
          <p className="font-medium">Profile information not available</p>
          <p className="text-sm mt-1">Complete the Interest, Competence, and Work Values quizzes to generate your profile codes.</p>
        </div>
      )}
      
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-4">
        We've used your assessment results to generate these codes, which help identify your best career matches.
      </p>
    </div>
  );
};
