
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

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
}

export const Tutorial = ({ isOpen, onClose }: TutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [arrowPosition, setArrowPosition] = useState({ top: 0, left: 0 });
  const [contentPosition, setContentPosition] = useState({ top: 0, left: 0 });
  const [targetElement, setTargetElement] = useState<Element | null>(null);

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

  useEffect(() => {
    if (!isOpen) return;

    const updatePositions = () => {
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

          // Position the content (adjust based on your UI)
          setContentPosition({
            left: rect.left + rect.width + 20,
            top: rect.top,
          });
        } else {
          console.warn(`Element not found for selector: ${currentTargetSelector}`);
        }
      } catch (error) {
        console.error(`Error finding element with selector: ${currentTargetSelector}`, error);
      }
    };

    updatePositions();
    window.addEventListener("resize", updatePositions);
    
    return () => {
      window.removeEventListener("resize", updatePositions);
    };
  }, [isOpen, currentStep, tutorialSteps]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      {/* Highlight around target element */}
      {targetElement && (
        <div
          className="absolute border-2 border-blue-500 rounded-md"
          style={{
            top: targetElement.getBoundingClientRect().top - 4,
            left: targetElement.getBoundingClientRect().left - 4,
            width: targetElement.getBoundingClientRect().width + 8,
            height: targetElement.getBoundingClientRect().height + 8,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
            zIndex: 60,
          }}
        />
      )}

      {/* Arrow pointing to the element */}
      <div
        className="absolute w-8 h-8 border-t-2 border-r-2 border-blue-500 transform rotate-45"
        style={{
          top: arrowPosition.top - 16,
          left: arrowPosition.left - 16,
          zIndex: 70,
        }}
      />

      {/* Content box */}
      <div
        className="absolute bg-white p-4 rounded-md shadow-lg max-w-xs"
        style={{
          top: contentPosition.top,
          left: contentPosition.left,
          zIndex: 70,
        }}
      >
        <p>{tutorialSteps[currentStep]?.content}</p>
        <div className="mt-4 flex justify-between">
          <Button variant="outline" onClick={handleSkip}>
            Skip Tutorial
          </Button>
          <Button onClick={handleNext}>
            {currentStep < tutorialSteps.length - 1 ? "Next" : "Finish"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
