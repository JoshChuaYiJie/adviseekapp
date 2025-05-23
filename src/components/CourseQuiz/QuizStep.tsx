
import { useState, useEffect } from 'react';
import { useQuiz } from '@/contexts/QuizContext';
import { QuizQuestion } from '@/integrations/supabase/client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QuizStepProps {
  questions: QuizQuestion[];
}

export const QuizStep: React.FC<QuizStepProps> = ({ questions }) => {
  const { responses, handleResponse } = useQuiz();
  console.log("Current quiz responses:", responses);
  
  // Group questions by section
  const sections = questions.reduce((acc: Record<string, QuizQuestion[]>, question) => {
    if (!acc[question.section]) {
      acc[question.section] = [];
    }
    acc[question.section].push(question);
    return acc;
  }, {});
  
  // Render a single-select question
  const renderSingleSelect = (question: QuizQuestion) => {
    const questionId = String(question.id); // Convert to string
    const currentResponse = responses[questionId] as string || '';
    console.log(`Question ${questionId} response:`, currentResponse);
    
    return (
      <div className="mb-6">
        <h4 className="font-medium mb-2">{question.question_text}</h4>
        <RadioGroup
          value={currentResponse}
          onValueChange={(value) => handleResponse(questionId, value)}
          className="space-y-2"
        >
          {question.options?.map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <RadioGroupItem id={`q${questionId}-${option}`} value={option} />
              <Label htmlFor={`q${questionId}-${option}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  };
  
  // Render a multi-select question
  const renderMultiSelect = (question: QuizQuestion) => {
    const questionId = String(question.id); // Convert to string
    const currentResponseString = responses[questionId] as string || '';
    // Split the comma-separated string into an array, or use empty array
    const currentResponse = currentResponseString ? currentResponseString.split(',') : [];
    console.log(`Question ${questionId} multi-select response:`, currentResponse);
    
    const handleCheckboxChange = (option: string, checked: boolean) => {
      let newResponse: string[];
      if (checked) {
        newResponse = [...currentResponse, option];
      } else {
        newResponse = currentResponse.filter(r => r !== option);
      }
      // Join array back to comma-separated string for storage
      handleResponse(questionId, newResponse.join(','));
    };
    
    return (
      <div className="mb-6">
        <h4 className="font-medium mb-2">{question.question_text}</h4>
        <div className="space-y-2">
          {question.options?.map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox 
                id={`q${questionId}-${option}`} 
                checked={currentResponse.includes(option)}
                onCheckedChange={(checked) => handleCheckboxChange(option, checked === true)} 
              />
              <Label htmlFor={`q${questionId}-${option}`}>{option}</Label>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render a text question
  const renderTextQuestion = (question: QuizQuestion) => {
    const questionId = String(question.id); // Convert to string
    const currentResponse = responses[questionId] as string || '';
    console.log(`Question ${questionId} text response:`, currentResponse);
    
    return (
      <div className="mb-6">
        <h4 className="font-medium mb-2">{question.question_text}</h4>
        <Input
          type="text"
          value={currentResponse}
          onChange={(e) => handleResponse(questionId, e.target.value)}
          placeholder=""
          className="w-full"
        />
      </div>
    );
  };
  
  return (
    <div>
      {Object.entries(sections).map(([section, sectionQuestions]) => (
        <div key={section} className="mb-8">
          <h3 className="text-xl font-bold mb-4 text-[#1E90FF]">{section}</h3>
          {sectionQuestions.map((question) => (
            <div key={question.id} className="mb-8">
              {question.question_type === 'single-select' && renderSingleSelect(question)}
              {question.question_type === 'multi-select' && renderMultiSelect(question)}
              {question.question_type === 'text' && renderTextQuestion(question)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
