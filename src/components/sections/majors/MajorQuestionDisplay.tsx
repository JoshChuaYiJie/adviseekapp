
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
          const response = responses[question.id];
          const isSkipped = response?.skipped;
          
          return (
            <div key={question.id || index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">
                  {question.category || "General"}
                </span>
                <span className="text-sm text-gray-500">Question {index + 1}/{openEndedQuestions.length}</span>
              </div>
              <p className="font-medium mb-3">{question.question}</p>
              <div className="space-y-2">
                <textarea
                  value={isSkipped ? "(Skipped)" : (response?.text || '')}
                  onChange={(e) => setResponses(prev => ({
                    ...prev, 
                    [question.id]: { text: e.target.value, skipped: false }
                  }))}
                  className={`w-full border border-gray-300 rounded-md p-2 min-h-[100px] ${isSkipped ? 'bg-gray-100 text-gray-500' : ''}`}
                  placeholder={isSkipped ? "(Skipped)" : "Type your answer here..."}
                  disabled={isSkipped}
                />
                <div className="flex justify-end mt-2">
                  <Button
                    variant={isSkipped ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => handleSkipQuestion(question.id)}
                    className="ml-2"
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
