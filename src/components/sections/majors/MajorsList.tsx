
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MajorRecommendationsType } from './types';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';

interface MajorsListProps {
  recommendations: MajorRecommendationsType;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onMajorClick: (majorName: string) => void;
  riasecCode: string;
  workValueCode: string;
}

export const MajorsList: React.FC<MajorsListProps> = ({
  recommendations,
  activeTab,
  onTabChange,
  onMajorClick,
  riasecCode,
  workValueCode
}) => {
  const { isCurrentlyDark } = useTheme();
  const [filter, setFilter] = useState<string>('');
  
  // Format major string (removes university suffix)
  const formatMajorName = (major: string): string => {
    return major.replace(/ at (NUS|NTU|SMU)$/, '');
  };
  
  // Get university from major string
  const getUniversityFromMajor = (major: string): string => {
    const match = major.match(/ at (NUS|NTU|SMU)$/);
    return match ? match[1] : '';
  };
  
  // Apply search filter
  const filterMajors = (majors: string[]): string[] => {
    if (!filter.trim()) return majors;
    return majors.filter(major => 
      major.toLowerCase().includes(filter.toLowerCase())
    );
  };
  
  // Calculate total count
  const totalCount = recommendations.exactMatches.length + 
                     recommendations.riasecMatches.length + 
                     recommendations.workValueMatches.length;
                     
  // Get majors for the selected tab
  const getMajorsByTab = () => {
    switch (activeTab) {
      case 'exact':
        return filterMajors(recommendations.exactMatches);
      case 'riasec':
        return filterMajors(recommendations.riasecMatches);
      case 'work':
        return filterMajors(recommendations.workValueMatches);
      default:
        // 'all' tab or any other value - show all majors with no duplicates
        const allMajors = [
          ...recommendations.exactMatches,
          ...recommendations.riasecMatches,
          ...recommendations.workValueMatches
        ];
        return filterMajors([...new Set(allMajors)]);
    }
  };

  const displayMajors = getMajorsByTab();
  
  return (
    <div>
      <div className="flex items-center space-x-2 mb-4">
        <p className="text-sm">Based on your RIASEC code <strong>{riasecCode}</strong> and Work Values code <strong>{workValueCode}</strong></p>
      </div>
      
      {/* Search filter */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search majors..."
          className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            All ({totalCount})
          </TabsTrigger>
          {recommendations.exactMatches.length > 0 && (
            <TabsTrigger value="exact">
              Exact ({recommendations.exactMatches.length})
            </TabsTrigger>
          )}
          {recommendations.riasecMatches.length > 0 && (
            <TabsTrigger value="riasec">
              RIASEC ({recommendations.riasecMatches.length})
            </TabsTrigger>
          )}
          {recommendations.workValueMatches.length > 0 && (
            <TabsTrigger value="work">
              Work Values ({recommendations.workValueMatches.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {displayMajors.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              {filter ? "No majors match your search filter." : "No majors found for this category."}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {displayMajors.map((major, index) => {
                // Determine major type for badge display
                let badgeType = "";
                let badgeColor = "";
                
                if (recommendations.exactMatches.includes(major)) {
                  badgeType = "Exact";
                  badgeColor = "bg-green-600";
                } else if (recommendations.riasecMatches.includes(major)) {
                  badgeType = "RIASEC";
                  badgeColor = "bg-purple-600";
                } else if (recommendations.workValueMatches.includes(major)) {
                  badgeType = "Work Values";
                  badgeColor = "bg-amber-600";
                }
                
                return (
                  <div
                    key={`${major}-${index}`}
                    className={`p-3 rounded-md cursor-pointer hover:opacity-80 transition-opacity ${
                      isCurrentlyDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    onClick={() => onMajorClick(major)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{formatMajorName(major)}</p>
                        <p className="text-xs opacity-70">{getUniversityFromMajor(major) || 'University not specified'}</p>
                      </div>
                      {badgeType && (
                        <Badge className={badgeColor}>
                          {badgeType}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
