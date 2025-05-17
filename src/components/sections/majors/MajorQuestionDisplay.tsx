
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { OpenEndedQuestion } from './types';

interface MajorQuestionDisplayProps {
  question?: string;
  response?: string;
  onResponseChange?: (value: string) => void;
  isSkipped?: boolean;
  selectedMajor?: string;
  openEndedQuestions?: OpenEndedQuestion[];
  loadingQuestions?: boolean;
  onBackToList?: () => void;
  isQuizMode?: boolean;
  onSubmitResponses?: () => void;
}

export const MajorQuestionDisplay = ({ 
  question, 
  response = '', 
  onResponseChange,
  isSkipped = false,
  selectedMajor,
  openEndedQuestions = [],
  loadingQuestions = false,
  onBackToList,
  isQuizMode = false,
  onSubmitResponses
}: MajorQuestionDisplayProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { text: string; skipped: boolean }>>({});

  // Handle standalone question mode
  if (question) {
    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onResponseChange) {
        onResponseChange(e.target.value);
      }
    };

    return (
      <div className={`p-6 rounded-lg ${
        isSkipped ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' :
        response ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
        isFocused ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' :
        'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
      } transition-colors duration-200`}>
        <h3 className="text-lg font-medium mb-4">{question}</h3>
        <Textarea
          value={response}
          onChange={handleTextareaChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Type your answer here..."
          className="min-h-[120px] resize-y"
          disabled={isSkipped}
        />
        {isSkipped && (
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
            This question was skipped. Click on it in the question navigator to answer it.
          </p>
        )}
      </div>
    );
  }

  // Handle multi-question mode
  if (openEndedQuestions && openEndedQuestions.length > 0) {
    const currentQuestion = openEndedQuestions[currentIndex];
    const currentAnswer = currentQuestion ? (answers[currentQuestion.id] || { text: '', skipped: false }) : { text: '', skipped: false };
    
    const handleNextQuestion = () => {
      if (currentIndex < openEndedQuestions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (onSubmitResponses) {
        onSubmitResponses();
      }
    };
    
    const handlePrevQuestion = () => {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (currentQuestion) {
        setAnswers({
          ...answers,
          [currentQuestion.id]: { text: e.target.value, skipped: false }
        });
      }
    };
    
    if (!currentQuestion) {
      return <p>No questions available for this major.</p>;
    }
    
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {openEndedQuestions.map((_, idx) => {
            const q = openEndedQuestions[idx];
            const ans = q ? answers[q.id] : undefined;
            const isSkipped = ans?.skipped || false;
            const isAnswered = ans?.text && !isSkipped;
            
            return (
              <div 
                key={idx} 
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs cursor-pointer transition-colors
                  ${idx === currentIndex ? 'ring-2 ring-offset-2' : ''}
                  ${isSkipped ? 'bg-yellow-500 text-white' : 
                    isAnswered ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                onClick={() => setCurrentIndex(idx)}
              >
                {idx + 1}
              </div>
            );
          })}
        </div>
        
        <div className={`p-6 rounded-lg ${
          currentAnswer.skipped ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' :
          currentAnswer.text ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
          'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
        }`}>
          <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>
          <Textarea
            value={currentAnswer.text}
            onChange={handleChange}
            placeholder="Type your answer here..."
            className="min-h-[120px] resize-y"
            disabled={currentAnswer.skipped}
          />
          {currentAnswer.skipped && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
              This question was skipped. You can still answer it by typing above.
            </p>
          )}
        </div>
        
        <div className="flex justify-between">
          <div className="space-x-2">
            <Button variant="outline" onClick={onBackToList} className="mr-2">
              Back to List
            </Button>
            <Button variant="outline" onClick={handlePrevQuestion} disabled={currentIndex === 0}>
              Previous
            </Button>
          </div>
          <div className="space-x-2">
            {currentIndex < openEndedQuestions.length - 1 ? (
              <Button onClick={handleNextQuestion}>
                Next
              </Button>
            ) : (
              <Button onClick={onSubmitResponses} className="bg-green-600 hover:bg-green-700">
                Submit
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return <p>No questions available.</p>;
};
