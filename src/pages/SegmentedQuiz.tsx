
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuiz } from "@/contexts/QuizContext";
import { supabase } from "@/integrations/supabase/client";
import { McqQuestion } from "@/utils/quizQuestions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface QuizDebuggerProps {
  userId: string;
  responses: any;
  quizType: string;
  debugData?: any;
}

const QuizDebugger: React.FC<QuizDebuggerProps> = ({ userId, responses, quizType, debugData }) => {
  const [showAll, setShowAll] = useState(false);

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="debug">
        <AccordionTrigger>Debug Info</AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-bold">User ID:</p>
              <p>{userId}</p>
            </div>
            <div>
              <p className="font-bold">Quiz Type:</p>
              <p>{quizType}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="font-bold">Responses:</p>
            {showAll ? (
              <pre>{JSON.stringify(responses, null, 2)}</pre>
            ) : (
              <pre>{JSON.stringify(Object.entries(responses).slice(0, 5).reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
              }, {}), null, 2)}</pre>
            )}
            {!showAll && Object.keys(responses).length > 5 && (
              <Button variant="link" onClick={() => setShowAll(true)}>Show All</Button>
            )}
          </div>
          {debugData && (
            <div className="mt-4">
              <p className="font-bold">Debug Data:</p>
              <pre>{JSON.stringify(debugData, null, 2)}</pre>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

const SegmentedQuiz = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast()
  const { isCurrentlyDark } = useTheme();
  const {
    currentStep,
    responses,
    questions,
    isLoading,
    isSubmitting,
    error,
    handleResponse,
    submitResponses,
    resetQuiz
  } = useQuiz();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDebugger, setShowDebugger] = useState(false);
  const [quizProgress, setQuizProgress] = useState(0);
  const [isLastStep, setIsLastStep] = useState(false);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
      } catch (error) {
        console.error("Error fetching user ID:", error);
        toast({
          title: "Error",
          description: "Failed to retrieve user information.",
        })
      } finally {
        setLoading(false);
      }
    };

    fetchUserId();
  }, []);

  // Load progress based on current step
  useEffect(() => {
    if (currentStep) {
      // Map step to progress percentage
      const stepToProgress: Record<number, number> = {
        1: 25,
        2: 50,
        3: 75,
        4: 100
      };
      setQuizProgress(stepToProgress[currentStep] || 0);
      
      // Set if this is the last step
      setIsLastStep(currentStep === 4); // Assuming 4 is the last step
    }
  }, [currentStep]);

  const handleAnswerChange = useCallback((questionId: string | number, value: string | string[] | null) => {
    handleResponse(questionId, value as string | string[]);
  }, [handleResponse]);

  const renderQuestion = useCallback(() => {
    if (loading || isLoading) {
      return <p>Loading questions...</p>;
    }

    if (!currentStep || !questions) {
      return <p>No questions available.</p>;
    }

    // Filter questions for current step
    const questionsForStep = questions.filter(q => q.section === currentStep);

    if (questionsForStep.length === 0) {
      return <p>No questions for this section.</p>;
    }

    return questionsForStep.map((question) => {
      const response = responses[question.id] || null;

      switch (question.type) {
        case "single-select":
          return (
            <Card key={question.id} className={`mb-4 ${isCurrentlyDark ? 'bg-gray-800 text-white' : ''}`}>
              <CardHeader>
                <CardTitle>{question.question}</CardTitle>
                <CardDescription>Choose one option</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup defaultValue={response ? String(response) : ""} onValueChange={(value) => handleAnswerChange(question.id, value)} className="flex flex-col space-y-2">
                  {question.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`r${question.id}-${index}`} className={isCurrentlyDark ? 'ring-offset-gray-800' : ''} />
                      <Label htmlFor={`r${question.id}-${index}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          );
        case "multi-select":
          return (
            <Card key={question.id} className={`mb-4 ${isCurrentlyDark ? 'bg-gray-800 text-white' : ''}`}>
              <CardHeader>
                <CardTitle>{question.question}</CardTitle>
                <CardDescription>Choose all that apply</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-2">
                  {question.options?.map((option, index) => {
                    const isChecked = Array.isArray(response) ? response.includes(option) : false;
                    return (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`c${question.id}-${index}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            let newValues: string[];
                            if (checked) {
                              newValues = Array.isArray(response) ? [...response, option] : [option];
                            } else {
                              newValues = Array.isArray(response) ? response.filter(item => item !== option) : [];
                            }
                            handleAnswerChange(question.id, newValues);
                          }}
                          className={isCurrentlyDark ? 'ring-offset-gray-800' : ''}
                        />
                        <Label htmlFor={`c${question.id}-${index}`}>{option}</Label>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        case "text":
          return (
            <Card key={question.id} className={`mb-4 ${isCurrentlyDark ? 'bg-gray-800 text-white' : ''}`}>
              <CardHeader>
                <CardTitle>{question.question}</CardTitle>
                <CardDescription>Enter your response</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  type="text"
                  id={`t${question.id}`}
                  value={response ? String(response) : ""}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className={isCurrentlyDark ? 'bg-gray-700 text-white' : ''}
                />
              </CardContent>
            </Card>
          );
        default:
          return <Card key={question.id}>Unknown question type</Card>;
      }
    });
  }, [currentStep, questions, responses, handleAnswerChange, loading, isLoading, isCurrentlyDark]);

  const goToNextStep = () => {
    if (currentStep < 4) { // Assuming maximum 4 steps
      navigate(`/quiz/interest-part ${currentStep + 1}`);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      navigate(`/quiz/interest-part ${currentStep - 1}`);
    }
  };

  const handleQuizCompletion = async () => {
    await submitResponses(`interest-part ${currentStep}`);
    navigate('/recommendations');
  };

  const handleNext = async () => {
    if (isLastStep) {
      // Handle quiz completion and save responses
      await handleQuizCompletion();
    } else {
      goToNextStep();
    }
  };

  const toggleDebugger = () => {
    setShowDebugger(!showDebugger);
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-center mb-8">{t("quiz.title", "Quiz")}</h1>

      {currentStep !== undefined && (
        <h2 className="text-xl font-semibold text-center mb-4">
          {t(`quiz.section.${String(currentStep)}`, `Section ${currentStep}`)}
        </h2>
      )}

      <Progress value={quizProgress} className="mb-4" />

      {renderQuestion()}

      <div className="flex justify-between">
        <Button variant="outline" onClick={goToPreviousStep} disabled={currentStep === 1}>
          {t("quiz.previous", "Previous")}
        </Button>
        <Button onClick={handleNext}>
          {isLastStep ? t("quiz.complete", "Complete") : t("quiz.next", "Next")}
        </Button>
      </div>

      <div className="flex justify-center mt-4">
        <Button variant="secondary" onClick={resetQuiz}>
          {t("quiz.reset", "Reset Quiz")}
        </Button>
      </div>

      {/* Conditionally render the QuizDebugger */}
      {showDebugger && (
        <QuizDebugger
          userId={userId || ""}
          responses={responses}
          quizType={String(currentStep) || ""}
          debugData={{
            questions,
            currentStep,
            responses: String(JSON.stringify(responses)),
            quizProgress,
          }}
        />
      )}

      {/* Button to toggle the debugger */}
      <div className="flex justify-center mt-4">
        <Button variant="ghost" onClick={toggleDebugger}>
          {showDebugger ? "Hide Debugger" : "Show Debugger"}
        </Button>
      </div>
    </div>
  );
};

export default SegmentedQuiz;
