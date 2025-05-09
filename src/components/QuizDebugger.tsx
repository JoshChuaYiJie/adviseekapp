import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, AlertTriangle, Bug, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateUserResponsesTable, testInsertResponse } from "@/contexts/quiz/utils/databaseHelpers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface QuizDebugData {
  userId?: string | null;
  authStatus?: 'checking' | 'authenticated' | 'unauthenticated';
  quizType?: string | null;
  responses?: Record<string, any>;
  errors?: any[];
}

export const QuizDebugger: React.FC<QuizDebugData> = ({
  userId,
  authStatus,
  quizType,
  responses,
  errors
}) => {
  const { toast } = useToast();
  const [validationResults, setValidationResults] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [lastResponses, setLastResponses] = useState<any[] | null>(null);
  const [lastError, setLastError] = useState<any | null>(null);
  
  useEffect(() => {
    if (errors && errors.length > 0 && errors !== lastError) {
      setLastError(errors);
    }
  }, [errors]);
  
  const validateDatabase = async () => {
    setIsValidating(true);
    try {
      const results = await validateUserResponsesTable();
      setValidationResults(results);
      
      toast({
        title: results.success ? "Validation successful" : "Validation warnings",
        description: results.details,
        variant: results.success ? "default" : "destructive"
      });
    } catch (err) {
      console.error("Error validating database:", err);
      setValidationResults({
        success: false,
        details: `Error: ${err instanceof Error ? err.message : String(err)}`
      });
      
      toast({
        title: "Validation error",
        description: `Error checking database configuration: ${err instanceof Error ? err.message : String(err)}`,
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };
  
  const runTestInsert = async () => {
    setIsTesting(true);
    try {
      const result = await testInsertResponse();
      setTestResult(result);
      
      toast({
        title: result.success ? "Test successful" : "Test failed",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (err) {
      console.error("Error running test insert:", err);
      setTestResult({
        success: false,
        message: `Error: ${err instanceof Error ? err.message : String(err)}`,
        details: err
      });
      
      toast({
        title: "Test error",
        description: `Error testing insert: ${err instanceof Error ? err.message : String(err)}`,
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  const loadLastResponses = async () => {
    if (!userId) {
      toast({
        title: "Not authenticated",
        description: "Please log in to view your responses",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_responses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error loading responses:', error);
        toast({
          title: "Error",
          description: `Failed to load responses: ${error.message}`,
          variant: "destructive"
        });
        return;
      }
      
      setLastResponses(data);
      
      if (data && data.length > 0) {
        toast({
          title: "Responses loaded",
          description: `Loaded ${data.length} recent responses`,
          variant: "default"
        });
      } else {
        toast({
          title: "No responses found",
          description: "No responses found for your account",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("Error loading responses:", err);
      toast({
        title: "Error",
        description: `Failed to load responses: ${err instanceof Error ? err.message : String(err)}`,
        variant: "destructive"
      });
    }
  };
  
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Quiz Debugger
        </CardTitle>
        <CardDescription>
          Tools for debugging quiz response issues
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="status">
        <TabsList className="grid grid-cols-4 mx-6">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="validation">Database</TabsTrigger>
          <TabsTrigger value="responses">Responses</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>
        
        <CardContent>
          <TabsContent value="status">
            <h3 className="text-lg font-semibold mb-3">Current Status</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm text-gray-500">Authentication</h4>
                {authStatus === 'checking' ? (
                  <Alert className="bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <AlertTitle>Checking authentication...</AlertTitle>
                  </Alert>
                ) : authStatus === 'authenticated' ? (
                  <Alert className="bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertTitle>Authenticated</AlertTitle>
                    <AlertDescription>
                      User ID: {userId}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <AlertTitle>Not authenticated</AlertTitle>
                    <AlertDescription>
                      You need to be logged in to save responses to the database
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-gray-500">Quiz Information</h4>
                {quizType ? (
                  <div className="p-3 bg-blue-50 rounded-md">
                    <p><strong>Quiz Type:</strong> {quizType}</p>
                    <p><strong>Questions Answered:</strong> {responses ? Object.keys(responses).length : 0}</p>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p>No active quiz</p>
                  </div>
                )}
              </div>
              
              {lastError && (
                <div>
                  <h4 className="font-medium text-sm text-gray-500">Last Error</h4>
                  <Alert className="bg-red-50">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <AlertTitle>Error occurred</AlertTitle>
                    <AlertDescription>
                      {typeof lastError === 'string' ? lastError : JSON.stringify(lastError, null, 2)}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="validation">
            <div className="space-y-3">
              <Button 
                onClick={validateDatabase} 
                disabled={isValidating}
                className="w-full"
              >
                {isValidating ? 'Validating...' : 'Validate Database Configuration'}
              </Button>
              
              {validationResults && (
                <>
                  <h4 className="font-medium">Validation Results</h4>
                  
                  <Alert className={validationResults.success ? 'bg-green-50' : 'bg-amber-50'}>
                    {validationResults.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                    <AlertTitle>
                      {validationResults.success ? 'Configuration is valid' : 'Configuration warnings'}
                    </AlertTitle>
                    <AlertDescription>
                      {validationResults.details}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center">
                      <span className="w-6">
                        {validationResults.hasRlsEnabled ? '✅' : '❌'}
                      </span>
                      <span>RLS enabled on user_responses table</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-6">
                        {validationResults.hasUniqueConstraint ? '✅' : '❌'}
                      </span>
                      <span>Unique constraint on user_id + id</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-6">
                        {validationResults.hasCorrectPolicy ? '✅' : '❌'}
                      </span>
                      <span>Correct RLS policy (user_id = auth.uid())</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="responses">
            <div className="space-y-3">
              <Button 
                onClick={loadLastResponses} 
                disabled={!userId}
                className="w-full"
              >
                Load Recent Responses
              </Button>
              
              {lastResponses && (
                <>
                  <h4 className="font-medium">
                    {lastResponses.length > 0
                      ? `Last ${lastResponses.length} Responses`
                      : 'No responses found'}
                  </h4>
                  
                  {lastResponses.length > 0 ? (
                    <ScrollArea className="h-60">
                      <div className="space-y-2">
                        {lastResponses.map((response, index) => (
                          <div key={index} className="p-2 bg-gray-50 rounded-md text-sm">
                            <p><strong>ID:</strong> {response.id}</p>
                            <p><strong>Question ID:</strong> {response.id}</p>
                            <p><strong>Quiz Type:</strong> {response.quiz_type || 'N/A'}</p>
                            <p><strong>Response:</strong> {response.response || JSON.stringify(response.response_array)}</p>
                            <p><strong>Score:</strong> {response.score}</p>
                            <p><strong>Created:</strong> {new Date(response.created_at).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : null}
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="testing">
            <div className="space-y-3">
              <Button 
                onClick={runTestInsert} 
                disabled={isTesting || authStatus !== 'authenticated'}
                className="w-full"
              >
                {isTesting ? 'Testing...' : 'Run Test Insert'}
              </Button>
              
              {authStatus !== 'authenticated' && (
                <Alert className="bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertTitle>Authentication required</AlertTitle>
                  <AlertDescription>
                    You need to be logged in to run test inserts
                  </AlertDescription>
                </Alert>
              )}
              
              {testResult && (
                <>
                  <h4 className="font-medium">Test Results</h4>
                  
                  <Alert className={testResult.success ? 'bg-green-50' : 'bg-red-50'}>
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <AlertTitle>
                      {testResult.success ? 'Test successful' : 'Test failed'}
                    </AlertTitle>
                    <AlertDescription>
                      {testResult.message}
                    </AlertDescription>
                  </Alert>
                  
                  {testResult.details && (
                    <div className="p-3 bg-gray-50 rounded-md text-xs overflow-x-auto">
                      <pre>{JSON.stringify(testResult.details, null, 2)}</pre>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => window.location.href = "/?section=about-me"}>
          Return to Dashboard
        </Button>
        <Button variant="destructive" onClick={() => localStorage.clear()}>
          Clear LocalStorage
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuizDebugger;
