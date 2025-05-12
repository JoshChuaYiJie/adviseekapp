
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
  isQuizMode?: boolean; // New prop to enable quiz mode
}

export const MajorRecommendations = ({ 
  topRiasec, 
  topWorkValues,
  isQuizMode = false
}: MajorRecommendationsProps) => {
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<MajorRecommendationsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [riasecCode, setRiasecCode] = useState('');
  const [workValueCode, setWorkValueCode] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [openEndedQuestions, setOpenEndedQuestions] = useState<OpenEndedQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submittingResponses, setSubmittingResponses] = useState(false);

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

  // Handle submitting open-ended question responses
  const handleSubmitResponses = async (responses: OpenEndedResponse[]) => {
    if (!responses.length) return;
    
    setSubmittingResponses(true);
    
    try {
      // Get the current user
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        toast({
          title: "Authentication required",
          description: "Please sign in to save your responses",
          variant: "destructive"
        });
        return;
      }

      // Store responses in the database
      const { error } = await supabase
        .from('open_ended_responses')
        .insert(
          responses.map(r => ({
            user_id: userId,
            question_id: r.questionId,
            question: r.question,
            response: r.response,
            criterion: r.criterion,
            major: r.major,
            school: r.school
          }))
        );
      
      if (error) throw error;
      
      // Mark the open-ended quiz as completed
      await supabase
        .from('quiz_completion')
        .upsert({
          user_id: userId,
          quiz_type: 'open-ended',
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,quiz_type'
        });
      
      // Update local storage for compatibility with existing code
      const completedQuizzes = JSON.parse(localStorage.getItem('completed_quiz_segments') || '[]');
      if (!completedQuizzes.includes('open-ended')) {
        completedQuizzes.push('open-ended');
        localStorage.setItem('completed_quiz_segments', JSON.stringify(completedQuizzes));
      }
      
      toast({
        title: "Responses saved",
        description: "Your answers have been submitted successfully!",
        variant: "default"
      });
      
      // Reset selected major after submission
      setSelectedMajor(null);
      setOpenEndedQuestions([]);
      
    } catch (error) {
      console.error('Error submitting responses:', error);
      toast({
        title: "Submission error",
        description: "There was a problem saving your responses",
        variant: "destructive"
      });
    } finally {
      setSubmittingResponses(false);
    }
  };

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
      <UserProfileDisplay riasecCode={riasecCode} workValueCode={workValueCode} />

      {selectedMajor ? (
        <MajorQuestionDisplay
          selectedMajor={selectedMajor}
          openEndedQuestions={openEndedQuestions}
          loadingQuestions={loadingQuestions}
          onBackToList={handleBackToList}
          isQuizMode={isQuizMode}
          onSubmitResponses={isQuizMode ? handleSubmitResponses : undefined}
        />
      ) : (
        <MajorsList
          recommendations={recommendations}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onMajorClick={handleMajorClick}
          riasecCode={riasecCode}
          workValueCode={workValueCode}
        />
      )}
    </div>
  );
};
