
import { useState, useEffect } from 'react';
import { 
  formCode, 
  getMatchingMajors, 
  mapRiasecToCode, 
  mapWorkValueToCode
} from '@/utils/recommendationUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfileDisplay } from './majors/UserProfileDisplay';
import { MajorsList } from './majors/MajorsList';
import { MajorQuestionDisplay } from './majors/MajorQuestionDisplay';
import { OpenEndedQuestion, OpenEndedResponse, MajorRecommendationsType } from './majors/types';
import { formatMajorForFile, formatMajorForDisplay, extractUniversityFromMajor } from './majors/MajorUtils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<MajorRecommendationsType | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [questions, setQuestions] = useState<OpenEndedQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // Form RIASEC and Work Value codes based on highest scoring components
  // The topRiasec and topWorkValues arrays are already sorted by score in descending order
  const riasecCode = formCode(topRiasec, mapRiasecToCode);
  const workValueCode = formCode(topWorkValues, mapWorkValueToCode);

  useEffect(() => {
    const getRecommendations = async () => {
      try {
        setLoading(true);
        console.log(`Getting recommendations for RIASEC: ${riasecCode}, Work Values: ${workValueCode}`);
        // Fix: Make sure we pass both arguments to the getMatchingMajors function
        const majorRecs = await getMatchingMajors(riasecCode, workValueCode);
        setRecommendations(majorRecs);
      } catch (error) {
        console.error('Error getting major recommendations:', error);
        toast({
          title: "Error",
          description: "Failed to load major recommendations",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };

    // If we have valid codes, get recommendations
    if (riasecCode && workValueCode) {
      getRecommendations();
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [riasecCode, workValueCode, toast]);

  const loadQuestions = async (majorName: string) => {
    try {
      setLoadingQuestions(true);
      const formattedMajor = formatMajorForFile(majorName);
      
      // Fetch questions from the JSON file
      const response = await fetch(`/school-data/Application Questions/${formattedMajor}`);
      if (!response.ok) {
        throw new Error(`Failed to load questions for ${majorName}`);
      }
      
      const data = await response.json() as OpenEndedQuestion[];
      setQuestions(data);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: "Error",
        description: "Failed to load questions for this major.",
        variant: "destructive"
      });
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleMajorSelect = async (majorName: string) => {
    setSelectedMajor(majorName);
    await loadQuestions(majorName);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleSubmitResponses = async () => {
    if (!selectedMajor) {
      toast({
        title: "No Major Selected",
        description: "Please select a major before submitting your responses.",
        variant: "destructive"
      });
      return;
    }
    
    if (!userId) {
      toast({
        title: "Not Logged In",
        description: "Please log in to save your responses.",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    try {
      // Prepare responses for database - convert to the format expected by the user_responses table
      const responsesToSubmit = questions.map(question => ({
        user_id: userId,
        question_id: question.id || '',
        response: answeredQuestions[question.id || ''] || '',
        quiz_type: 'open-ended'
      }));
      
      // Upload responses to Supabase user_responses table (not open_ended_responses)
      const { error } = await supabase
        .from('user_responses')
        .insert(responsesToSubmit);
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Update quiz completion status
      const { error: completionError } = await supabase
        .from('quiz_completion')
        .upsert({
          user_id: userId,
          quiz_type: 'open-ended'
        }, {
          onConflict: 'user_id, quiz_type'
        });
        
      if (completionError) {
        console.error('Error updating quiz completion:', completionError);
      } else {
        setCompleted(true);
        toast({
          title: "Responses Submitted",
          description: "Your responses have been successfully submitted!",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error submitting responses:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your responses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
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
              {formatMajorForDisplay(selectedMajor)}
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
                  onSubmitResponses={handleSubmitResponses}
                />
                <button
                  onClick={handleSubmitResponses}
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
