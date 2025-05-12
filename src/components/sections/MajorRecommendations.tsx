
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { UserProfileDisplay } from './majors/UserProfileDisplay';
import { MajorsList } from './majors/MajorsList';
import { MajorQuestionDisplay } from './majors/MajorQuestionDisplay';
import { MajorRecommendationsType } from './majors/types';
import { useRecommendationLogic } from './majors/RecommendationLogic';
import { useQuestionHandler } from './majors/QuestionHandler';

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
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<MajorRecommendationsType | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  // Debug the incoming data
  console.log("MajorRecommendations - Received topRiasec:", topRiasec);
  console.log("MajorRecommendations - Received topWorkValues:", topWorkValues);
  
  // Use recommendation logic
  const { loading, riasecCode, workValueCode, userId } = useRecommendationLogic({
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

  const handleTakeQuiz = () => {
    // Redirect to the open-ended quiz page
    navigate('/open-ended');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <UserProfileDisplay riasecCode={riasecCode} workValueCode={workValueCode} />
        
        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2">Recommended Majors</h3>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[220px]" />
              <Skeleton className="h-4 w-[240px]" />
            </div>
          ) : isQuizMode ? (
            <div className="flex flex-col items-center p-6 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <h4 className="text-lg font-semibold mb-4">Open-ended Question Quiz</h4>
              <p className="text-center mb-6">
                Complete this quiz to explore specific questions about your chosen major.
              </p>
              <Button 
                onClick={handleTakeQuiz} 
                size="lg" 
                className="px-8 py-2"
              >
                Take Quiz
              </Button>
            </div>
          ) : recommendations && (
            <MajorsList 
              recommendations={recommendations} 
              activeTab={activeTab} 
              onTabChange={handleTabChange} 
              onMajorClick={handleMajorSelect}
              riasecCode={riasecCode}
              workValueCode={workValueCode}
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
              <p>No specific questions found for this major.</p>
            )}
          </>
        ) : (
          <p>Select a major to view specific questions.</p>
        )}
      </div>
    </div>
  );
};
