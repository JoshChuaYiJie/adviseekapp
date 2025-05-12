
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';

interface UserProfileDisplayProps {
  riasecCode: string;
  workValueCode: string;
}

export const UserProfileDisplay: React.FC<UserProfileDisplayProps> = ({ riasecCode, workValueCode }) => {
  const isLoading = !riasecCode && !workValueCode;
  
  const getRiasecCodeDescription = (code: string) => {
    if (!code) return 'Complete the Interest and Competence quizzes to see your RIASEC profile.';
    
    // Add descriptions for each RIASEC code (you can customize these)
    const descriptions: Record<string, string> = {
      'R': 'Realistic - Practical, hands-on problem solver',
      'I': 'Investigative - Analytical, scientific, intellectual',
      'A': 'Artistic - Creative, original, independent',
      'S': 'Social - Supportive, cooperative, nurturing',
      'E': 'Enterprising - Competitive, leadership-oriented',
      'C': 'Conventional - Organized, detail-oriented, methodical'
    };
    
    // Create a description for the full code
    return code.split('').map(letter => descriptions[letter] || letter).join(', ');
  };
  
  const getWorkValueCodeDescription = (code: string) => {
    if (!code) return 'Complete the Work Values quiz to see your work values.';
    
    // Add descriptions for each Work Value code (you can customize these)
    const descriptions: Record<string, string> = {
      'A': 'Achievement - Results-oriented, accomplishment',
      'I': 'Independence - Autonomy, self-direction',
      'R': 'Relationships - Connection with colleagues',
      'S': 'Support - Assistance and encouragement',
      'Rc': 'Recognition - Visibility, status, appreciation',
      'W': 'Working Conditions - Environment, job security'
    };
    
    // Handle special case for Recognition (Rc)
    if (code.includes('Rc')) {
      return [
        descriptions['Rc'], 
        ...code.replace('Rc', '').split('').map(letter => descriptions[letter] || letter)
      ].join(', ');
    }
    
    // Create a description for the full code
    return code.split('').map(letter => descriptions[letter] || letter).join(', ');
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
        <CardDescription>
          Based on your quiz responses, we've determined your personality profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">RIASEC Code:</h3>
              <Skeleton className="h-8 w-1/3 mb-1" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Work Values Code:</h3>
              <Skeleton className="h-8 w-1/3 mb-1" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">RIASEC Code:</h3>
              {riasecCode ? (
                <>
                  <p className="text-xl font-bold tracking-wide">{riasecCode}</p>
                  <p className="text-sm text-gray-500 mt-1">{getRiasecCodeDescription(riasecCode)}</p>
                </>
              ) : (
                <div className="flex items-start space-x-2 p-2 bg-amber-50 dark:bg-amber-900 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    RIASEC profile data missing. Please complete the Interest and Competence quizzes.
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Work Values Code:</h3>
              {workValueCode ? (
                <>
                  <p className="text-xl font-bold tracking-wide">{workValueCode}</p>
                  <p className="text-sm text-gray-500 mt-1">{getWorkValueCodeDescription(workValueCode)}</p>
                </>
              ) : (
                <div className="flex items-start space-x-2 p-2 bg-amber-50 dark:bg-amber-900 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Work Values profile data missing. Please complete the Work Values quiz.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Your profile is used to match you with majors that fit your personality traits 
            and work preferences. Complete all quizzes for the most accurate results.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
