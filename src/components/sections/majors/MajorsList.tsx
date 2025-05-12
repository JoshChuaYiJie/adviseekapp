
import { useTheme } from "@/contexts/ThemeContext";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InfoIcon } from 'lucide-react';
import { MajorRecommendationsType } from './types';

interface MajorsListProps {
  recommendations: MajorRecommendationsType | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onMajorClick: (major: string) => void;
  riasecCode: string;
  workValueCode: string;
}

export const MajorsList = ({
  recommendations,
  activeTab,
  onTabChange,
  onMajorClick,
  riasecCode,
  workValueCode
}: MajorsListProps) => {
  const { isCurrentlyDark } = useTheme();

  // Determine which majors to display based on active tab
  const getMajorsToDisplay = () => {
    if (!recommendations) {
      console.log("No recommendations provided to MajorsList");
      return [];
    }
    
    console.log(`Getting majors to display for tab: ${activeTab}`);
    
    switch (activeTab) {
      case 'exact':
        return recommendations.exactMatches || [];
      case 'permutation':
        return recommendations.permutationMatches || [];
      case 'riasec':
        return recommendations.riasecMatches || [];
      case 'workValue':
        return recommendations.workValueMatches || [];
      case 'all':
        // For 'all' tab, show the best available matches based on priority
        if (recommendations.exactMatches && recommendations.exactMatches.length > 0)
          return recommendations.exactMatches;
        if (recommendations.permutationMatches && recommendations.permutationMatches.length > 0)
          return recommendations.permutationMatches;
        if (recommendations.riasecMatches && recommendations.riasecMatches.length > 0)
          return recommendations.riasecMatches;
        if (recommendations.workValueMatches && recommendations.workValueMatches.length > 0)
          return recommendations.workValueMatches;
        return [];
      default:
        console.log(`Unknown tab: ${activeTab}`);
        return [];
    }
  };

  // Get match description based on active tab
  const getMatchDescription = () => {
    if (!recommendations) return '';
    
    switch (activeTab) {
      case 'exact':
        return 'Exact matches for both your RIASEC and Work Values codes.';
      case 'permutation':
        return 'Matches with the same elements in your codes but in different orders.';
      case 'riasec':
        return 'Matches based only on your RIASEC personality type.';
      case 'workValue':
        return 'Matches based only on your Work Values.';
      default:
        return 'All available recommendations.';
    }
  };

  // Format major name for display (remove university suffix if present)
  const formatMajorForDisplay = (major: string): string => {
    // Remove university suffix if it exists
    return major.replace(/ at (NUS|NTU|SMU)$/, '');
  };

  // Extract university name from major (if present)
  const extractUniversityFromMajor = (major: string): string => {
    const match = major.match(/ at (NUS|NTU|SMU)$/);
    return match ? match[1] : '';
  };

  // Count majors in each category with null safety
  const majorCounts = {
    exact: recommendations?.exactMatches?.length || 0,
    permutation: recommendations?.permutationMatches?.length || 0,
    riasec: recommendations?.riasecMatches?.length || 0,
    workValue: recommendations?.workValueMatches?.length || 0
  };
  
  // Get the majors to display based on the active tab
  const majorsToDisplay = getMajorsToDisplay();
  
  // Check if we have any matches
  const hasNoMatches = !majorsToDisplay.length;
  
  // Log the state of recommendations for debugging
  console.log("MajorsList - Recommendations state:", recommendations);
  console.log("MajorsList - Active tab:", activeTab);
  console.log("MajorsList - Majors to display:", majorsToDisplay);

  if (hasNoMatches) {
    return (
      <div className={`p-6 rounded-lg text-center ${isCurrentlyDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
        <InfoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h4 className="text-lg font-medium mb-2">No Matches Found</h4>
        <p className="mb-4">
          We couldn't find majors that match your RIASEC code ({riasecCode}) and work values code ({workValueCode}).
        </p>
        <p>
          Try completing more quizzes or consider exploring majors based on your individual components instead.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Recommended Majors</h3>
        <Badge className={`${isCurrentlyDark ? 'bg-purple-700' : 'bg-purple-100 text-purple-800'}`}>
          {majorsToDisplay.length} majors found
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange} className="mb-6">
        <TabsList className="mb-2">
          <TabsTrigger value="all" disabled={!recommendations}>All</TabsTrigger>
          <TabsTrigger value="exact" disabled={!majorCounts.exact}>
            Exact Matches {majorCounts.exact > 0 && `(${majorCounts.exact})`}
          </TabsTrigger>
          <TabsTrigger value="permutation" disabled={!majorCounts.permutation}>
            Similar {majorCounts.permutation > 0 && `(${majorCounts.permutation})`}
          </TabsTrigger>
          <TabsTrigger value="riasec" disabled={!majorCounts.riasec}>
            RIASEC Only {majorCounts.riasec > 0 && `(${majorCounts.riasec})`}
          </TabsTrigger>
          <TabsTrigger value="workValue" disabled={!majorCounts.workValue}>
            Work Values Only {majorCounts.workValue > 0 && `(${majorCounts.workValue})`}
          </TabsTrigger>
        </TabsList>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {getMatchDescription()}
        </p>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {majorsToDisplay.map((major, index) => (
          <Card 
            key={index} 
            className={`p-4 ${isCurrentlyDark ? 'bg-gray-700' : 'bg-white'} hover:shadow-md transition-shadow cursor-pointer`}
            onClick={() => onMajorClick(major)}
          >
            <p className="font-medium text-md">{formatMajorForDisplay(major)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {extractUniversityFromMajor(major) || "University not specified"}
            </p>
            <p className="text-xs text-blue-500 mt-2 hover:underline">
              View Questions →
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};
