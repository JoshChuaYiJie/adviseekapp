
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuizDebug } from '@/hooks/useQuizDebug';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Bug, ArrowRight, Database, RefreshCw } from 'lucide-react';

// Update props to include userId and authStatus
interface QuizDebuggerProps {
  userId: string;
  authStatus: 'checking' | 'authenticated' | 'unauthenticated';
}

const QuizDebugger = ({ userId, authStatus }: QuizDebuggerProps) => {
  const [activeTab, setActiveTab] = useState('riasec');
  const { 
    isLoading, 
    responseData, 
    error, 
    init, 
    fetchResponses 
  } = useQuizDebug();

  useEffect(() => {
    if (authStatus === 'authenticated' && userId) {
      init();
    }
  }, [authStatus, userId, init]);

  const handleFetchResponses = (pattern?: 'RIASEC' | 'WorkValues' | 'All') => {
    fetchResponses(pattern);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bug className="mr-2 h-4 w-4" />
          Quiz Response Debugger
          {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {authStatus !== 'authenticated' ? (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-100">
            Please log in to use the debugger.
          </div>
        ) : (
          <>
            <div className="mb-4 space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleFetchResponses('RIASEC')}
                disabled={isLoading}
              >
                <Database className="mr-2 h-3 w-3" />
                Fetch RIASEC
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleFetchResponses('WorkValues')}
                disabled={isLoading}
              >
                <Database className="mr-2 h-3 w-3" />
                Fetch Work Values
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleFetchResponses('All')}
                disabled={isLoading}
              >
                <Database className="mr-2 h-3 w-3" />
                Fetch All
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => init()}
                disabled={isLoading}
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Reset
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="riasec">RIASEC Data</TabsTrigger>
                <TabsTrigger value="workvalues">Work Values Data</TabsTrigger>
                <TabsTrigger value="raw">Raw Responses</TabsTrigger>
              </TabsList>

              <TabsContent value="riasec">
                <DataTabContent 
                  data={responseData.filter(r => 
                    ['interest-part 1', 'interest-part 2', 'competence'].includes(r.quiz_type)
                  )} 
                  isLoading={isLoading}
                  error={error}
                  title="RIASEC Responses"
                />
              </TabsContent>

              <TabsContent value="workvalues">
                <DataTabContent 
                  data={responseData.filter(r => r.quiz_type === 'work-values')} 
                  isLoading={isLoading}
                  error={error}
                  title="Work Values Responses"
                />
              </TabsContent>

              <TabsContent value="raw">
                <div className="rounded border bg-muted/50 p-2 mb-2">
                  <pre className="text-xs overflow-auto max-h-[400px]">
                    {JSON.stringify(responseData, null, 2)}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
};

interface DataTabContentProps {
  data: any[];
  isLoading: boolean;
  error: string | null;
  title: string;
}

const DataTabContent = ({ data, isLoading, error, title }: DataTabContentProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800 text-red-800 dark:text-red-100">
        Error: {error}
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
        No {title.toLowerCase()} found. Try taking a quiz first!
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="p-2 rounded border bg-card">
            <div className="text-xs font-mono">
              <div className="grid grid-cols-2 gap-1">
                <span className="font-bold">Quiz Type:</span>
                <span>{item.quiz_type}</span>
                <span className="font-bold">Question ID:</span>
                <span>{item.question_id}</span>
                <span className="font-bold">Response:</span>
                <span>{item.response}</span>
                <span className="font-bold">Score:</span>
                <span>{item.score}</span>
                <span className="font-bold">Component:</span>
                <span>{item.component || 'None'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default QuizDebugger;
