
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfileDisplay } from './majors/UserProfileDisplay';
import { MajorsList } from './majors/MajorsList';
import { MajorQuestionDisplay } from './majors/MajorQuestionDisplay';
import { MajorRecommendationsType } from './majors/types';
import { useRecommendationLogic } from './majors/RecommendationLogic';
import { useQuestionHandler } from './majors/QuestionHandler';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

// Define props interface
interface MajorRecommendationsProps {
  topRiasec: Array<{ component: string; average: number; score: number }>;
  topWorkValues: Array<{ component: string; average: number; score: number }>;
  isQuizMode?: boolean;
}

export const MajorRecommendations: React.FC<MajorRecommendationsProps> = ({ 
  topRiasec, 
  topWorkValues,
  isQuizMode = false
}) => {
  const [recommendations, setRecommendations] = useState<MajorRecommendationsType | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  // Debug the incoming data
  console.log("MajorRecommendations - Received topRiasec:", topRiasec);
  console.log("MajorRecommendations - Received topWorkValues:", topWorkValues);
  
  // Use recommendation logic
  const { loading, riasecCode, workValueCode, userId, error } = useRecommendationLogic({
    topRiasec,
    topWorkValues,
    onRecommendationsLoaded: setRecommendations
  });

  // Use question handler
  const { 
    questions,
    loadingQuestions,
    answeredQuestions,
    setAnsweredQuestions,
    submitting,
    completed,
    loadQuestions,
    handleSubmitResponses
  } = useQuestionHandler({ userId });

  const handleMajorSelect = async (majorName: string) => {
    setSelectedMajor(majorName);
    await loadQuestions(majorName);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Check if we have RIASEC and Work Values data
  const hasIncompleteProfile = (!topRiasec || topRiasec.length === 0) || (!topWorkValues || topWorkValues.length === 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        {hasIncompleteProfile && (
          <Alert className="mb-4 bg-amber-50 dark:bg-amber-900 border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">Incomplete Profile</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              Please complete all quiz segments to view your profile and recommendations.
            </AlertDescription>
          </Alert>
        )}

        <UserProfileDisplay riasecCode={riasecCode} workValueCode={workValueCode} />
        
        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2">Recommended Majors</h3>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[220px]" />
              <Skeleton className="h-4 w-[240px]" />
            </div>
          ) : recommendations && (
            <MajorsList 
              recommendations={recommendations} 
              activeTab={activeTab} 
              onTabChange={handleTabChange} 
              onMajorClick={handleMajorSelect}
              riasecCode={riasecCode}
              workValueCode={workValueCode}
              error={error}
            />
          )}
        </div>
      </div>

      <div>
        {selectedMajor ? (
          <>
            <h3 className="text-xl font-medium mb-2">
              {selectedMajor}
              {isQuizMode && (
                <button 
                  onClick={() => setSelectedMajor(null)}
                  className="ml-2 text-sm text-blue-500 hover:underline"
                >
                  Change Major
                </button>
              )}
            </h3>
            {loadingQuestions ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-[280px]" />
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[260px]" />
              </div>
            ) : questions.length > 0 ? (
              <>
                <MajorQuestionDisplay
                  selectedMajor={selectedMajor}
                  openEndedQuestions={questions}
                  loadingQuestions={false}
                  onBackToList={() => setSelectedMajor(null)}
                  isQuizMode={true}
                  onSubmitResponses={() => handleSubmitResponses(selectedMajor)}
                />
                <button
                  onClick={() => handleSubmitResponses(selectedMajor)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
                  disabled={submitting || completed}
                >
                  {submitting ? 'Submitting...' : completed ? 'Submitted' : 'Submit Responses'}
                </button>
              </>
            ) : (
              <p className="italic text-gray-500">No specific questions found for this major.</p>
            )}
          </>
        ) : (
          <p className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            Select a major from the list to view specific questions.
          </p>
        )}
      </div>
    </div>
  );
};
