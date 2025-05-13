
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { OpenEndedQuestion } from './types';

interface MajorQuestionDisplayProps {
  selectedMajor: string;
  openEndedQuestions: OpenEndedQuestion[];
  loadingQuestions: boolean;
  onBackToList: () => void;
  isQuizMode?: boolean;
  onSubmitResponses?: () => void;
}

export const MajorQuestionDisplay: React.FC<MajorQuestionDisplayProps> = ({
  selectedMajor,
  openEndedQuestions,
  loadingQuestions,
  onBackToList,
  isQuizMode = false,
  onSubmitResponses
}) => {
  const [responses, setResponses] = useState<Record<string, { text: string; skipped: boolean }>>({});
  
  const handleSkipQuestion = (questionId: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { text: '', skipped: true }
    }));
  };
  
  const handleChangeResponse = (questionId: string, text: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { text, skipped: false }
    }));
  };

  const getQuestionStatus = (questionId: string): 'default' | 'skipped' | 'completed' => {
    const response = responses[questionId];
    if (!response) return 'default';
    if (response.skipped) return 'skipped';
    if (response.text.trim().length > 0) return 'completed';
    return 'default';
  };

  if (loadingQuestions) {
    return <div>Loading questions...</div>;
  }

  if (!openEndedQuestions || openEndedQuestions.length === 0) {
    return (
      <div>
        <div className="flex justify-between mb-4">
          <h3 className="font-medium text-gray-700">Questions for {selectedMajor}</h3>
          <Button variant="ghost" size="sm" onClick={onBackToList}>Back to List</Button>
        </div>
        <p>No specific questions available for this major.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h3 className="font-medium text-gray-700">{`Questions for ${selectedMajor}`}</h3>
        {!isQuizMode && (
          <Button variant="ghost" size="sm" onClick={onBackToList}>Back to List</Button>
        )}
      </div>

      <div className="space-y-6">
        {openEndedQuestions.map((question, index) => {
          const status = getQuestionStatus(question.id);
          const isSkipped = status === 'skipped';
          const isCompleted = status === 'completed';
          
          // Define dynamic classes based on status
          let boxClasses = "border border-gray-200 rounded-lg p-4";
          if (isSkipped) boxClasses += " bg-amber-50 dark:bg-amber-900/20";
          if (isCompleted) boxClasses += " bg-green-50 dark:bg-green-900/20";
          
          return (
            <div key={question.id || index} className={boxClasses}>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">
                  {question.category || "General"}
                </span>
                <span className="text-sm text-gray-500">Question {index + 1}/{openEndedQuestions.length}</span>
              </div>
              <p className="font-medium mb-3">{question.question}</p>
              <div className="space-y-2">
                <textarea
                  value={isSkipped ? "(Skipped)" : (responses[question.id]?.text || '')}
                  onChange={(e) => handleChangeResponse(question.id, e.target.value)}
                  className={`w-full border border-gray-300 rounded-md p-2 min-h-[100px] ${
                    isSkipped ? 'bg-gray-100 text-gray-500' : 
                    isCompleted ? 'border-green-300' : ''
                  }`}
                  placeholder={isSkipped ? "(Skipped)" : "Type your answer here..."}
                  disabled={isSkipped}
                />
                <div className="flex justify-end mt-2">
                  <Button
                    variant={isSkipped ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => handleSkipQuestion(question.id)}
                    className={`ml-2 ${
                      isSkipped ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-800 dark:text-amber-100' : ''
                    }`}
                  >
                    {isSkipped ? 'Skipped' : 'Skip Question'}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isQuizMode && onSubmitResponses && (
        <div className="mt-6">
          <Button 
            onClick={onSubmitResponses}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white"
          >
            Submit Responses
          </Button>
        </div>
      )}
    </div>
  );
}
