
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import useQuizDebug from '@/hooks/useQuizDebug';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { validateUserResponsesTable } from '@/contexts/quiz/utils/databaseHelpers';

export const QuizDebugger = () => {
  const { 
    isLoading, 
    responseData, 
    error, 
    userId, 
    init, 
    fetchResponses 
  } = useQuizDebug();

  useEffect(() => {
    init();
  }, [init]);

  const validateDatabase = async () => {
    try {
      const result = await validateUserResponsesTable();
      console.log('Database validation result:', result);
      alert(`Database validation: ${result.success ? 'Passed' : 'Failed'}\n${result.details}`);
    } catch (error) {
      console.error('Error validating database:', error);
      alert('Error validating database. See console for details.');
    }
  };

  if (!userId) {
    return (
      <Alert>
        <AlertTitle>Not logged in</AlertTitle>
        <AlertDescription>Please log in to view debug information.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="text-xl font-bold mb-4">Quiz Debugger</h2>
      <div className="mb-4">
        <p><strong>User ID:</strong> {userId}</p>
      </div>

      <div className="flex space-x-2 mb-4">
        <Button 
          onClick={() => fetchResponses('RIASEC')} 
          disabled={isLoading}
          size="sm"
          variant="outline"
        >
          Fetch RIASEC Responses
        </Button>
        <Button 
          onClick={() => fetchResponses('WorkValues')} 
          disabled={isLoading}
          size="sm"
          variant="outline"
        >
          Fetch Work Values
        </Button>
        <Button 
          onClick={validateDatabase} 
          size="sm"
          variant="outline"
        >
          Validate Database
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <p>Loading...</p>
      ) : responseData.length > 0 ? (
        <ScrollArea className="h-[400px] border rounded-md p-4">
          <h3 className="mb-2 font-semibold">Responses ({responseData.length})</h3>
          <ul className="space-y-2">
            {responseData.map((item, index) => (
              <li key={index} className="border-b pb-2">
                <p><strong>Question ID:</strong> {item.question_id}</p>
                <p><strong>Response:</strong> {item.response || JSON.stringify(item.response_array)}</p>
                <p><strong>Quiz Type:</strong> {item.quiz_type}</p>
                <p><strong>Component:</strong> {item.component || 'N/A'}</p>
                <p><strong>Score:</strong> {item.score}</p>
              </li>
            ))}
          </ul>
        </ScrollArea>
      ) : (
        <p>No response data available. Click one of the buttons above to fetch data.</p>
      )}
    </Card>
  );
};

export default QuizDebugger;
