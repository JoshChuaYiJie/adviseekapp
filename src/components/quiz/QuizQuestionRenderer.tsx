
import React, { useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import { McqQuestion } from "@/utils/quizQuestions";

interface QuizQuestionRendererProps {
  currentStep?: number;
  questions?: McqQuestion[];
  responses: Record<string | number, string | string[]>;
  handleAnswerChange: (questionId: string | number, value: string | string[] | null) => void;
  loading: boolean;
  isLoading: boolean;
}

const QuizQuestionRenderer: React.FC<QuizQuestionRendererProps> = ({
  currentStep,
  questions,
  responses,
  handleAnswerChange,
  loading,
  isLoading
}) => {
  const { isCurrentlyDark } = useTheme();

  const renderQuestion = useCallback(() => {
    if (loading || isLoading) {
      return <p>Loading questions...</p>;
    }

    if (!currentStep || !questions) {
      return <p>No questions available.</p>;
    }

    // Filter questions for current step
    const currentQuizType = `interest-part ${currentStep}`;
    const questionsForStep = questions.filter(q => q.category === currentQuizType);

    if (questionsForStep.length === 0) {
      return <p>No questions for this section.</p>;
    }

    return questionsForStep.map((question) => {
      const response = responses[question.id] || null;

      // Infer question type based on response data
      const questionType = Array.isArray(response) ? "multi-select" : "single-select";

      switch (questionType) {
        case "single-select":
          return (
            <Card key={question.id} className={`mb-4 ${isCurrentlyDark ? 'bg-gray-800 text-white' : ''}`}>
              <CardHeader>
                <CardTitle>{question.question}</CardTitle>
                <CardDescription>Choose one option</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  defaultValue={response ? String(response) : ""} 
                  onValueChange={(value) => handleAnswerChange(question.id, value)} 
                  className="flex flex-col space-y-2"
                >
                  {question.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={option} 
                        id={`r${question.id}-${index}`} 
                        className={isCurrentlyDark ? 'ring-offset-gray-800' : ''} 
                      />
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
        default:
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
      }
    });
  }, [currentStep, questions, responses, handleAnswerChange, loading, isLoading, isCurrentlyDark]);

  return (
    <div className="quiz-questions">
      {renderQuestion()}
    </div>
  );
};

export default QuizQuestionRenderer;
