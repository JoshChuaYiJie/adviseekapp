
import { useState } from 'react';
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
    const currentResponse = responses[question.id] as string || '';
    
    return (
      <div className="mb-6">
        <h4 className="font-medium mb-2">{question.question_text}</h4>
        <RadioGroup
          value={currentResponse}
          onValueChange={(value) => handleResponse(question.id, value)}
          className="space-y-2"
        >
          {question.options?.map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <RadioGroupItem id={`q${question.id}-${option}`} value={option} />
              <Label htmlFor={`q${question.id}-${option}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  };
  
  // Render a multi-select question
  const renderMultiSelect = (question: QuizQuestion) => {
    const currentResponse = (responses[question.id] as string[]) || [];
    
    const handleCheckboxChange = (option: string, checked: boolean) => {
      if (checked) {
        handleResponse(question.id, [...currentResponse, option]);
      } else {
        handleResponse(question.id, currentResponse.filter(r => r !== option));
      }
    };
    
    return (
      <div className="mb-6">
        <h4 className="font-medium mb-2">{question.question_text}</h4>
        <div className="space-y-2">
          {question.options?.map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox 
                id={`q${question.id}-${option}`} 
                checked={currentResponse.includes(option)}
                onCheckedChange={(checked) => handleCheckboxChange(option, checked === true)} 
              />
              <Label htmlFor={`q${question.id}-${option}`}>{option}</Label>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render a text question
  const renderTextQuestion = (question: QuizQuestion) => {
    const currentResponse = responses[question.id] as string || '';
    
    return (
      <div className="mb-6">
        <h4 className="font-medium mb-2">{question.question_text}</h4>
        <Input
          type="text"
          value={currentResponse}
          onChange={(e) => handleResponse(question.id, e.target.value)}
          placeholder="Type your answer here..."
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
