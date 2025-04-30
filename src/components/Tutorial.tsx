
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Step {
  target: string;
  content: string;
  action?: string;
  position?: "top" | "bottom" | "left" | "right";
  requireClick?: boolean;
}

interface TutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip?: () => void;
}

export const Tutorial = ({ isOpen, onClose, onSkip }: TutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [arrowPosition, setArrowPosition] = useState({ top: 0, left: 0 });
  const [contentPosition, setContentPosition] = useState({ top: 0, left: 0 });
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [waitingForElementClick, setWaitingForElementClick] = useState(false);

  const tutorialSteps: Step[] = [
    {
      target: '[data-id="my-resume"]',
      content: "Click on My Resume to upload or start building your resume",
      requireClick: true,
    },
    {
      target: '[data-tutorial="drop-resume"]',
      content: "Upload your resume here",
    },
    {
      target: '[data-tutorial="build-resume"]',
      content: "Alternatively, build your resume with our top-notch templates and proprietary AI",
    },
    {
      target: 'table',
      content: "View your resumes here, a separate resume for separate programmes maximises your chances!",
    },
    {
      target: '[data-id="apply-now"]',
      content: "Click on Apply Now to start your application",
      requireClick: true,
    },
    {
      target: '[data-tutorial="university-select"]',
      content: "Pick which university you want to apply to",
      requireClick: true,
    },
    {
      target: '[data-tutorial="program-select"]',
      content: "Pick your desired programme",
      requireClick: true,
    },
    {
      target: '[data-tutorial="application-questions"]',
      content: "Our AI will help you write the best applications!",
    },
    {
      target: '[data-id="mock-interviews"]',
      content: "Click on Mock Interviews to prepare for your interviews",
      requireClick: true,
    },
    {
      target: '[data-tutorial="program-select-interview"]',
      content: "Pick your application",
      requireClick: true,
    },
    {
      target: '[data-tutorial="interview-questions"]',
      content: "Adviseek AI will create practice questions for you to prepare!",
    },
    {
      target: '[data-id="get-paid"]',
      content: "Want to earn money?",
      requireClick: true,
    },
    {
      target: '[data-tutorial="apply-consultant"]',
      content: "Apply to be a consultant to help others and earn at the same time!",
    },
    {
      target: '[data-tutorial="upgrade-button"]',
      content: "Upgrade for advanced features!",
    },
  ];

  // Memoize the updatePositions function to prevent infinite loops
  const updatePositions = useCallback(() => {
    if (!isOpen) return;
    
    const currentTargetSelector = tutorialSteps[currentStep]?.target;
    if (!currentTargetSelector) return;

    try {
      const element = document.querySelector(currentTargetSelector);
      
      if (element) {
        setTargetElement(element);
        const rect = element.getBoundingClientRect();
        
        // Position the arrow
        setArrowPosition({
          left: rect.left + rect.width / 2,
          top: rect.top + rect.height / 2,
        });

        // Position the content (adjust based on viewport position)
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        let contentLeft = rect.left + rect.width + 20;
        let contentTop = rect.top;
        
        // Adjust if would go off screen
        if (contentLeft + 300 > windowWidth) {
          contentLeft = Math.max(rect.left - 320, 10);
        }
        
        if (contentTop + 200 > windowHeight) {
          contentTop = Math.max(windowHeight - 220, 10);
        }
        
        setContentPosition({
          left: contentLeft,
          top: contentTop,
        });
      } else {
        console.warn(`Element not found for selector: ${currentTargetSelector}`);
      }
    } catch (error) {
      console.error(`Error finding element with selector: ${currentTargetSelector}`, error);
    }
  }, [isOpen, currentStep, tutorialSteps]);

  // Set up click handlers for elements requiring clicks
  useEffect(() => {
    if (!isOpen || !tutorialSteps[currentStep]?.requireClick) {
      setWaitingForElementClick(false);
      return;
    }

    const currentTargetSelector = tutorialSteps[currentStep]?.target;
    if (!currentTargetSelector) return;

    try {
      const element = document.querySelector(currentTargetSelector);
      
      if (element) {
        setWaitingForElementClick(true);
        
        const handleElementClick = () => {
          setWaitingForElementClick(false);
          handleNext();
        };
        
        element.addEventListener('click', handleElementClick, { capture: true });
        return () => {
          element.removeEventListener('click', handleElementClick, { capture: true });
        };
      }
    } catch (error) {
      console.error(`Error setting click handler for: ${currentTargetSelector}`, error);
    }
  }, [isOpen, currentStep, tutorialSteps]);

  // Update positions on initial render, step change, and window resize
  useEffect(() => {
    if (!isOpen) return;
    
    updatePositions();
    window.addEventListener("resize", updatePositions);
    
    return () => {
      window.removeEventListener("resize", updatePositions);
    };
  }, [isOpen, currentStep, updatePositions]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeAndClose();
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      completeAndClose();
    }
  };
  
  const completeAndClose = () => {
    // Save tutorial completion status
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.id) {
      localStorage.setItem(`tutorial_completed_${user.id}`, 'true');
    }
    onClose();
  };

  if (!isOpen) return null;

  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;
  const currentStepData = tutorialSteps[currentStep];

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      {/* Highlight around target element */}
      {targetElement && (
        <div
          className="absolute border-2 border-blue-500 rounded-md z-60 animate-pulse pointer-events-none"
          style={{
            top: targetElement.getBoundingClientRect().top - 4,
            left: targetElement.getBoundingClientRect().left - 4,
            width: targetElement.getBoundingClientRect().width + 8,
            height: targetElement.getBoundingClientRect().height + 8,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
          }}
        />
      )}

      {/* Arrow pointing to the element */}
      <div
        className="absolute w-8 h-8 border-t-2 border-r-2 border-blue-500 transform rotate-45 z-70 pointer-events-none"
        style={{
          top: arrowPosition.top - 16,
          left: arrowPosition.left - 16,
        }}
      />

      {/* Content box */}
      <div
        className="absolute bg-white dark:bg-gray-800 p-4 rounded-md shadow-lg max-w-xs z-70 transition-all duration-300"
        style={{
          top: contentPosition.top,
          left: contentPosition.left,
          maxWidth: "280px", // Ensure the tutorial box isn't too wide
        }}
      >
        <button 
          onClick={handleSkip} 
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Close tutorial"
        >
          <X size={16} />
        </button>
        
        <p className="text-sm mb-2 text-gray-500 dark:text-gray-400">
          Step {currentStep + 1} of {tutorialSteps.length}
        </p>
        
        <Progress value={progress} className="mb-3 h-1" />
        
        <p className="mb-4 dark:text-white">{currentStepData?.content}</p>
        
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={handleSkip}>
            Skip Tutorial
          </Button>
          
          {currentStepData?.requireClick ? (
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium animate-pulse">
              Click the highlighted element to continue
            </p>
          ) : (
            <Button size="sm" onClick={handleNext}>
              {currentStep < tutorialSteps.length - 1 ? "Next" : "Finish"}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
