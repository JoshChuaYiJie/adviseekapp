
import { useState, useEffect } from 'react';
import { 
  formCode, 
  getMatchingMajors, 
  mapRiasecToCode, 
  mapWorkValueToCode,
  MajorRecommendations as MajorRecommendationsType
} from '@/utils/recommendationUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfileDisplay } from './majors/UserProfileDisplay';
import { MajorsList } from './majors/MajorsList';
import { MajorQuestionDisplay } from './majors/MajorQuestionDisplay';
import { OpenEndedQuestion } from './majors/types';
import { formatMajorForFile, formatMajorForDisplay, extractUniversityFromMajor } from './majors/MajorUtils';

// Define props interface
interface MajorRecommendationsProps {
  topRiasec: Array<{ component: string; average: number; score: number }>;
  topWorkValues: Array<{ component: string; average: number; score: number }>;
}

export const MajorRecommendations = ({ topRiasec, topWorkValues }: MajorRecommendationsProps) => {
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
