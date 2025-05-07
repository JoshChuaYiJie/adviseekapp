
import { useState, useEffect } from 'react';
import { useTheme } from "@/contexts/ThemeContext";
import { 
  formCode, 
  getMatchingMajors, 
  mapRiasecToCode, 
  mapWorkValueToCode 
} from '@/utils/recommendationUtils';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoIcon } from 'lucide-react';

// Define props interface
interface MajorRecommendationsProps {
  topRiasec: Array<{ component: string; average: number; score: number }>;
  topWorkValues: Array<{ component: string; average: number; score: number }>;
}

export const MajorRecommendations = ({ topRiasec, topWorkValues }: MajorRecommendationsProps) => {
  const { isCurrentlyDark } = useTheme();
  const [recommendedMajors, setRecommendedMajors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [riasecCode, setRiasecCode] = useState('');
  const [workValueCode, setWorkValueCode] = useState('');

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      
      // Form the RIASEC and Work Value codes
      const rCode = formCode(topRiasec, mapRiasecToCode);
      const wvCode = formCode(topWorkValues, mapWorkValueToCode);
      
      setRiasecCode(rCode);
      setWorkValueCode(wvCode);
      
      // Get matching majors
      const majors = await getMatchingMajors(rCode, wvCode);
      setRecommendedMajors(majors);
      
      setLoading(false);
    };
    
    if (topRiasec.length > 0 && topWorkValues.length > 0) {
      fetchRecommendations();
    }
  }, [topRiasec, topWorkValues]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
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

      {recommendedMajors.length > 0 ? (
        <div>
          <h3 className="text-lg font-medium mb-4">Recommended Majors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedMajors.map((major, index) => (
              <Card key={index} className={`p-4 ${isCurrentlyDark ? 'bg-gray-700' : 'bg-white'} hover:shadow-md transition-shadow`}>
                <p className="font-medium text-md">{major}</p>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className={`p-6 rounded-lg text-center ${isCurrentlyDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
          <InfoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h4 className="text-lg font-medium mb-2">No Exact Matches Found</h4>
          <p>
            We couldn't find majors that exactly match your RIASEC code ({riasecCode}) and work values code ({workValueCode}).
            Try completing more quizzes or consider exploring majors that align with your individual RIASEC or work value components.
          </p>
        </div>
      )}
    </div>
  );
};
