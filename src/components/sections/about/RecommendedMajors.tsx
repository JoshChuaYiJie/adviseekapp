
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";

interface RecommendedMajorsProps {
  recommendedMajors: {
    exactMatches: string[];
    riasecMatches: string[];
    workValueMatches: string[];
  };
  riasecCode: string;
  workValueCode: string;
}

export const RecommendedMajors = ({ recommendedMajors, riasecCode, workValueCode }: RecommendedMajorsProps) => {
  const { isCurrentlyDark } = useTheme();
  
  // Helper function to format major name (removes university suffix if present)
  const formatMajorName = (major: string): string => {
    return major.replace(/ at (NUS|NTU|SMU)$/, '');
  };

  // Get university from major string
  const getUniversityFromMajor = (major: string): string => {
    const match = major.match(/ at (NUS|NTU|SMU)$/);
    return match ? match[1] : '';
  };
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">Recommended Majors</h3>
      <p className="mb-4">Based on your RIASEC code ({riasecCode}) and Work Values code ({workValueCode}):</p>
      
      {/* Exact Matches */}
      {recommendedMajors.exactMatches.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-md mb-2 flex items-center">
            <Badge className="mr-2 bg-green-600">Exact Match</Badge>
            Best match for your profile
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {recommendedMajors.exactMatches.map((major, index) => (
              <div 
                key={`exact-${index}`} 
                className={`p-3 rounded-md ${isCurrentlyDark ? 'bg-gray-700' : 'bg-gray-100'}`}
              >
                <p className="font-medium">{formatMajorName(major)}</p>
                <p className="text-xs opacity-70">
                  {getUniversityFromMajor(major) || 'University not specified'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* RIASEC Matches */}
      {recommendedMajors.riasecMatches.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-md mb-2 flex items-center">
            <Badge className="mr-2 bg-purple-600">RIASEC Match</Badge>
            Matches based on your personality type
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {recommendedMajors.riasecMatches.map((major, index) => (
              <div 
                key={`riasec-${index}`} 
                className={`p-3 rounded-md ${isCurrentlyDark ? 'bg-gray-700' : 'bg-gray-100'}`}
              >
                <p className="font-medium">{formatMajorName(major)}</p>
                <p className="text-xs opacity-70">
                  {getUniversityFromMajor(major) || 'University not specified'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Work Value Matches */}
      {recommendedMajors.workValueMatches.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-md mb-2 flex items-center">
            <Badge className="mr-2 bg-amber-600">Work Values Match</Badge>
            Matches based on your work preferences
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {recommendedMajors.workValueMatches.map((major, index) => (
              <div 
                key={`wv-${index}`} 
                className={`p-3 rounded-md ${isCurrentlyDark ? 'bg-gray-700' : 'bg-gray-100'}`}
              >
                <p className="font-medium">{formatMajorName(major)}</p>
                <p className="text-xs opacity-70">
                  {getUniversityFromMajor(major) || 'University not specified'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* No matches found */}
      {recommendedMajors.exactMatches.length === 0 && 
       recommendedMajors.riasecMatches.length === 0 && 
       recommendedMajors.workValueMatches.length === 0 && (
        <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-center">
          <p>No major recommendations found for your profile. Please complete all quizzes or contact support.</p>
        </div>
      )}
    </div>
  );
};
