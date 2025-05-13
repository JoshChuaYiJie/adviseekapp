
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

interface RecommendationDisclaimerProps {
  onClose: () => void;
}

export const RecommendationDisclaimer: React.FC<RecommendationDisclaimerProps> = ({ 
  onClose 
}) => {
  const navigate = useNavigate();
  
  const handleContinue = () => {
    navigate('/recommendations');
  };
  
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold text-purple-700">Your Recommendations</DialogTitle>
        <DialogDescription className="text-sm text-gray-600 mt-2">
          We've already analyzed your profile and have prepared major recommendations for you.
        </DialogDescription>
      </DialogHeader>
      
      <div className="py-4">
        <p className="mb-4">
          Before we can show you your ideal programme, we need you to rate some modules
          so we can better understand your preferences.
        </p>
        <p className="mb-4">
          This step is crucial for us to match you with the perfect major, degree, and school
          based on your unique interests and strengths.
        </p>
        <div className="rounded-lg bg-purple-50 p-4 text-sm border border-purple-100">
          <p className="font-medium text-purple-700 mb-1">What happens next:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>You'll be presented with modules to rate from 1-10</li>
            <li>The more modules you rate, the better your final recommendation</li>
            <li>After rating, we'll show your ideal programme match</li>
          </ul>
        </div>
      </div>
      
      <DialogFooter className="sm:justify-between flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          onClick={onClose}
        >
          Go Back
        </Button>
        <Button
          className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
          onClick={handleContinue}
        >
          Start Rating Modules
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
