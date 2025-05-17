
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

interface RecommendationDisclaimerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecommendationDisclaimer: React.FC<RecommendationDisclaimerProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const navigate = useNavigate();

  const handleProceed = () => {
    onClose();
    // Navigate to the recommendations page
    navigate('/recommendations');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Find Your Ideal Programme</DialogTitle>
          <DialogDescription>
            Based on your quiz responses, we've already generated recommended majors for you.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="mb-4">
            To determine your final recommended major, degree, and school, we need you to rate several 
            modules related to your interests and profile.
          </p>
          <p className="text-sm text-muted-foreground">
            This process helps us refine our recommendations to match your preferences more accurately.
          </p>
        </div>
        
        <DialogFooter className="sm:justify-between flex-row">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleProceed}>Rate Modules</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
