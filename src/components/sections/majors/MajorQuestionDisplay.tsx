
import { useState } from 'react';
import { useTheme } from "@/contexts/ThemeContext";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InfoIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { OpenEndedQuestion } from './types';

interface MajorQuestionDisplayProps {
  selectedMajor: string | null;
  openEndedQuestions: OpenEndedQuestion[];
  loadingQuestions: boolean;
  onBackToList: () => void;
}

export const MajorQuestionDisplay = ({ 
  selectedMajor,
  openEndedQuestions,
  loadingQuestions,
  onBackToList
}: MajorQuestionDisplayProps) => {
  const { isCurrentlyDark } = useTheme();

  if (!selectedMajor) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium">{selectedMajor} Questions</h3>
        <Button 
          onClick={onBackToList} 
          variant="outline" 
          size="sm"
        >
          Back to Majors
        </Button>
      </div>
      
      {loadingQuestions ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : openEndedQuestions.length > 0 ? (
        <div className="space-y-6">
          {openEndedQuestions.map((q, index) => (
            <Card key={index} className={`p-4 ${isCurrentlyDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div>
                <Badge className="mb-2">{q.criterion}</Badge>
                <p className="text-md">{q.question}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className={`p-6 rounded-lg text-center ${isCurrentlyDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
          <InfoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h4 className="text-lg font-medium mb-2">No Questions Available</h4>
          <p>
            We couldn't find any questions for this major. Please try another major.
          </p>
        </div>
      )}
    </div>
  );
};
