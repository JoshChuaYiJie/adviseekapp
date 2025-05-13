
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface MajorQuestionDisplayProps {
  question: string;
  response: string;
  onResponseChange: (value: string) => void;
  isSkipped: boolean;
}

export const MajorQuestionDisplay = ({ 
  question, 
  response, 
  onResponseChange, 
  isSkipped 
}: MajorQuestionDisplayProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onResponseChange(e.target.value);
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
};
