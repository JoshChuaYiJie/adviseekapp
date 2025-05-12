
import { useState, useEffect } from 'react';
import { useTheme } from "@/contexts/ThemeContext";
import { 
  formCode, 
  getMatchingMajors, 
  mapRiasecToCode, 
  mapWorkValueToCode,
  MajorRecommendations as MajorRecommendationsType,
  sanitizeToFilename
} from '@/utils/recommendationUtils';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Define props interface
interface MajorRecommendationsProps {
  topRiasec: Array<{ component: string; average: number; score: number }>;
  topWorkValues: Array<{ component: string; average: number; score: number }>;
}

interface OpenEndedQuestion {
  id?: string;
  question: string;
  criterion: string;
  major?: string;
  school?: string;
}

export const MajorRecommendations = ({ topRiasec, topWorkValues }: MajorRecommendationsProps) => {
  const { isCurrentlyDark } = useTheme();
  const [recommendations, setRecommendations] = useState<MajorRecommendationsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [riasecCode, setRiasecCode] = useState('');
  const [workValueCode, setWorkValueCode] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [openEndedQuestions, setOpenEndedQuestions] = useState<OpenEndedQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      
      // Form the RIASEC and Work Value codes
      const rCode = formCode(topRiasec, mapRiasecToCode);
      const wvCode = formCode(topWorkValues, mapWorkValueToCode);
      
      setRiasecCode(rCode);
      setWorkValueCode(wvCode);
      
      // Get matching majors with the new flexible matching logic
      const majorsRecommendations = await getMatchingMajors(rCode, wvCode);
      setRecommendations(majorsRecommendations);
      
      console.log('Generated question files:', majorsRecommendations.questionFiles);
      
      // Set the active tab based on matching results
      if (majorsRecommendations.exactMatches.length > 0) {
        setActiveTab('exact');
      } else if (majorsRecommendations.permutationMatches.length > 0) {
        setActiveTab('permutation');
      } else if (majorsRecommendations.riasecMatches.length > 0) {
        setActiveTab('riasec');
      } else if (majorsRecommendations.workValueMatches.length > 0) {
        setActiveTab('workValue');
      } else {
        setActiveTab('all');
      }
      
      setLoading(false);
    };
    
    if (topRiasec.length > 0 && topWorkValues.length > 0) {
      fetchRecommendations();
    }
  }, [topRiasec, topWorkValues]);

  // Determine which majors to display based on what matches we found
  const getMajorsToDisplay = () => {
    if (!recommendations) return [];
    
    switch (activeTab) {
      case 'exact':
        return recommendations.exactMatches;
      case 'permutation':
        return recommendations.permutationMatches;
      case 'riasec':
        return recommendations.riasecMatches;
      case 'workValue':
        return recommendations.workValueMatches;
      case 'all':
        // Return the best available matches in order of priority
        if (recommendations.exactMatches.length > 0)
          return recommendations.exactMatches;
        if (recommendations.permutationMatches.length > 0)
          return recommendations.permutationMatches;
        if (recommendations.riasecMatches.length > 0)
          return recommendations.riasecMatches;
        if (recommendations.workValueMatches.length > 0)
          return recommendations.workValueMatches;
        return [];
      default:
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

  // Format major name for file search
  const formatMajorForFile = (major: string, university: string): string => {
    // Remove university suffix if it exists and replace spaces with underscores
    const cleanMajor = major.replace(/ at (NUS|NTU|SMU)$/, '').replace(/\s+/g, '_');
    return `${cleanMajor}_${university}`;
  };

  // Load questions from a specific major file
  const loadQuestionsForMajor = async (major: string, university: string) => {
    try {
      setLoadingQuestions(true);
      const formattedMajor = formatMajorForFile(major, university);
      const filePath = `quiz_refer/Open_ended_quiz_questions/${formattedMajor}.json`;
      console.log('Attempting to load questions from:', filePath);
      const response = await fetch(filePath);
      
      if (!response.ok) {
        console.error(`Failed to load questions for ${formattedMajor}: ${response.status}`);
        setOpenEndedQuestions([]);
        setLoadingQuestions(false);
        return;
      }
      
      const questionsData = await response.json();
      
      // Group questions by criterion
      const criterionCategories = ['Interests', 'Skills', 'Experiences'];
      const questionsByCriterion: Record<string, OpenEndedQuestion[]> = {};
      
      // Initialize categories
      criterionCategories.forEach(criterion => {
        questionsByCriterion[criterion] = [];
      });
      
      // Organize questions by criterion
      questionsData.forEach((q: OpenEndedQuestion) => {
        if (criterionCategories.includes(q.criterion)) {
          questionsByCriterion[q.criterion].push(q);
        }
      });
      
      // Select up to 3 questions from each criterion
      const selectedQuestions: OpenEndedQuestion[] = [];
      
      Object.keys(questionsByCriterion).forEach(criterion => {
        const criterionQuestions = questionsByCriterion[criterion];
        // Take up to 3 questions from each criterion
        const questionsToAdd = criterionQuestions.slice(0, 3);
        selectedQuestions.push(...questionsToAdd);
      });
      
      setOpenEndedQuestions(selectedQuestions);
      console.log('Loaded questions for major:', formattedMajor, selectedQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
      setOpenEndedQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Handle clicking on a major card
  const handleMajorClick = (major: string) => {
    const university = extractUniversityFromMajor(major);
    const displayMajor = formatMajorForDisplay(major);
    
    setSelectedMajor(displayMajor);
    loadQuestionsForMajor(displayMajor, university || 'NUS'); // Default to NUS if university not found
  };

  // Handle going back to the list of majors
  const handleBackToList = () => {
    setSelectedMajor(null);
    setOpenEndedQuestions([]);
  };

  const majorCounts = {
    exact: recommendations?.exactMatches.length || 0,
    permutation: recommendations?.permutationMatches.length || 0,
    riasec: recommendations?.riasecMatches.length || 0,
    workValue: recommendations?.workValueMatches.length || 0
  };
  
  const majorsToDisplay = getMajorsToDisplay();
  const hasNoMatches = !majorsToDisplay.length;

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

      {selectedMajor ? (
        // Display questions for selected major
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium">{selectedMajor} Questions</h3>
            <Button 
              onClick={handleBackToList} 
              variant="outline" 
              size="sm"
            >
              Back to Majors
            </Button>
          </div>
          
          {loadingQuestions ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : openEndedQuestions.length > 0 ? (
            <div className="space-y-6">
              {openEndedQuestions.map((q, index) => (
                <Card key={index} className={`p-4 ${isCurrentlyDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <div>
                    <Badge className="mb-2">{q.criterion}</Badge>
                    <p className="text-md">{q.question}</p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className={`p-6 rounded-lg text-center ${isCurrentlyDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              <InfoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h4 className="text-lg font-medium mb-2">No Questions Available</h4>
              <p>
                We couldn't find any questions for this major. Please try another major.
              </p>
            </div>
          )}
        </div>
      ) : (!hasNoMatches ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Recommended Majors</h3>
            <Badge className={`${isCurrentlyDark ? 'bg-purple-700' : 'bg-purple-100 text-purple-800'}`}>
              {majorsToDisplay.length} majors found
            </Badge>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
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
                onClick={() => handleMajorClick(major)}
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
      ) : (
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
      ))}
    </div>
  );
};
