
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { UserProfileDisplay } from './majors/UserProfileDisplay';
import { MajorsList } from './majors/MajorsList';
import { MajorQuestionDisplay } from './majors/MajorQuestionDisplay';
import { OpenEndedQuestion } from './majors/types';
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
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  // Debug the incoming data
  console.log("MajorRecommendations - Received topRiasec:", topRiasec);
  console.log("MajorRecommendations - Received topWorkValues:", topWorkValues);
  
  // Use recommendation logic
  const { loading, riasecCode, workValueCode, userId, recommendations } = useRecommendationLogic({
    topRiasec,
    topWorkValues
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
    handleSubmitResponses,
    recommendedMajors,
    prepareQuestionsForRecommendedMajors
  } = useQuestionHandler({ userId });

  // When recommendations are loaded in quiz mode, automatically prepare questions
  useEffect(() => {
    if (isQuizMode && recommendations && recommendedMajors.length > 0) {
      prepareQuestionsForRecommendedMajors();
    }
  }, [isQuizMode, recommendations, recommendedMajors.length, prepareQuestionsForRecommendedMajors]);

  const handleMajorSelect = async (majorName: string) => {
    setSelectedMajor(majorName);
    await loadQuestions(majorName);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const getQuestionStatus = (questionId: string): 'default' | 'skipped' | 'completed' => {
    const response = answeredQuestions[questionId];
    if (!response) return 'default';
    if (response.skipped) return 'skipped';
    if (response.response.trim().length > 0) return 'completed';
    return 'default';
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
                onClick={prepareQuestionsForRecommendedMajors} 
                size="lg" 
                className="px-8 py-2"
                disabled={loadingQuestions}
              >
                {loadingQuestions ? "Loading Questions..." : "Load Questions"}
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
              <MajorQuestionDisplay
                selectedMajor={selectedMajor}
                openEndedQuestions={questions}
                loadingQuestions={false}
                onBackToList={() => setSelectedMajor(null)}
                isQuizMode={true}
                onSubmitResponses={() => handleSubmitResponses(selectedMajor)}
              />
            ) : (
              <p>No specific questions found for this major.</p>
            )}
          </>
        ) : questions.length > 0 ? (
          <>
            <h3 className="text-xl font-medium mb-2">Questions Based on Your Profile</h3>
            {loadingQuestions ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-[280px]" />
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[260px]" />
              </div>
            ) : (
              <>
                <div className="space-y-6 mb-6">
                  {questions.map((question, index) => {
                    const status = getQuestionStatus(question.id);
                    const isSkipped = status === 'skipped';
                    const isCompleted = status === 'completed';
                    
                    // Define dynamic classes based on status
                    let boxClasses = "border border-gray-200 rounded-lg p-4";
                    if (isSkipped) boxClasses += " bg-amber-50 dark:bg-amber-900/20";
                    if (isCompleted) boxClasses += " bg-green-50 dark:bg-green-900/20";
                    
                    return (
                      <div key={question.id || index} className={boxClasses}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">
                            {question.majorName || "General"} - {question.category || "General"}
                          </span>
                        </div>
                        <p className="font-medium mb-3">{question.question}</p>
                        <div className="space-y-2">
                          <textarea
                            value={isSkipped ? "(Skipped)" : (answeredQuestions[question.id]?.response || '')}
                            onChange={(e) => setAnsweredQuestions(prev => ({
                              ...prev,
                              [question.id]: {
                                response: e.target.value,
                                skipped: false
                              }
                            }))}
                            className={`w-full border border-gray-300 rounded-md p-2 min-h-[100px] ${
                              isSkipped ? 'bg-gray-100 text-gray-500' : 
                              isCompleted ? 'border-green-300' : ''
                            }`}
                            placeholder="Type your answer here..."
                            disabled={isSkipped}
                          />
                          <div className="flex justify-end mt-2">
                            <Button
                              variant={isSkipped ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => setAnsweredQuestions(prev => ({
                                ...prev,
                                [question.id]: {
                                  response: '',
                                  skipped: true
                                }
                              }))}
                              className={`${
                                isSkipped ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-800 dark:text-amber-100' : ''
                              }`}
                            >
                              {isSkipped ? 'Skipped' : 'Skip Question'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button
                  onClick={() => handleSubmitResponses(null)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4 w-full"
                  disabled={submitting || completed}
                >
                  {submitting ? 'Submitting...' : completed ? 'Submitted' : 'Submit Responses'}
                </Button>
              </>
            )}
          </>
        ) : (
          <div className="p-4 border border-gray-200 rounded-md">
            <p className="text-center text-gray-600">
              {isQuizMode ? 
                "Click 'Load Questions' to see questions based on your recommended majors." : 
                "Select a major to view specific questions."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
