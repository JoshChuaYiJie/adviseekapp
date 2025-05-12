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
  
  // Form RIASEC and Work Value codes based on highest scoring components
  // Since topRiasec and topWorkValues are already sorted by score in QuizSegments.tsx,
  // the formCode function will use this order to generate the codes
  const riasecCode = formCode(topRiasec, mapRiasecToCode);
  const workValueCode = formCode(topWorkValues, mapWorkValueToCode);

  useEffect(() => {
    const getRecommendations = async () => {
      try {
        setLoading(true);
        console.log(`Getting recommendations for RIASEC: ${riasecCode}, Work Values: ${workValueCode}`);
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

  const getMatchesArray = () => {
    if (!recommendations) return [];
    
    // Prioritize exact matches, then permutation matches, then others
    if (recommendations.exactMatches.length > 0) {
      return recommendations.exactMatches;
    } else if (recommendations.permutationMatches.length > 0) {
      return recommendations.permutationMatches;
    } else if (recommendations.riasecMatches.length > 0) {
      return recommendations.riasecMatches;
    } else if (recommendations.workValueMatches.length > 0) {
      return recommendations.workValueMatches;
    } else {
      return [];
    }
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
      // Prepare responses for database
      const responsesToSubmit: OpenEndedResponse[] = questions.map(question => ({
        questionId: question.id || '',
        question: question.question,
        response: answeredQuestions[question.id || ''] || '',
        criterion: question.criterion,
        major: selectedMajor,
        school: question.school
      }));
      
      // Upload responses to Supabase
      const { error } = await supabase
        .from('open_ended_responses')
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
          variant: "success"
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

  const matches = getMatchesArray();

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
          ) : matches.length > 0 ? (
            <MajorsList majors={matches} onMajorSelect={handleMajorSelect} />
          ) : (
            <p>No direct matches found. Consider exploring related fields.</p>
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
                  questions={questions}
                  answeredQuestions={answeredQuestions}
                  setAnsweredQuestions={setAnsweredQuestions}
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
