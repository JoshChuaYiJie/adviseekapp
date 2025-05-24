
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

interface Step {
  target: string;
  content: string;
  action?: string;
  position?: "top" | "bottom" | "left" | "right";
  requireClick?: boolean;
  autoSelectValue?: string;
  autoFill?: Record<string, string>;
  scrollTarget?: string;
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
  const { t } = useTranslation();

  const tutorialSteps: Step[] = [
    {
      target: '[data-id="about-me"]',
      content: "Click on About Me to edit your profile",
      requireClick: true,
    },
    {
      target: '[data-tutorial="take-quiz"]',
      content: "Take the personality quizzes for us to find out more about you",
    },
    {
      target: '[data-tutorial="my-profile"]',
      content: "Click here to see in-depth analysis of your profile",
      requireClick: true,
    },
    {
      target: '[data-tutorial="riasec-chart"], [data-tutorial="work-values-chart"]',
      content: "Your Profiles will be displayed once the quizzes are completed!",
      scrollTarget: '[data-tutorial="recommended-majors"]',
    },
    {
      target: '[data-tutorial="narrow-down-further"]',
      content: "After our AI determines your recommended majors, you can go ahead and narrow it further by rating the modules each major consists of",
    },
    {
      target: '[data-tutorial="my-resume"]',
      content: "Need a resume?",
      scrollTarget: '[data-tutorial="my-resume"]',
      requireClick: true,
    },
    {
      target: '[data-tutorial="build-resume"]',
      content: "Powered by the quizzes, Adviseek AI will help you craft the resume that best represents you! (You can download and save the resume as well)",
    },
    {
      target: '[data-id="applied-programmes"]',
      content: "Track your Applied Programmes here",
      requireClick: true,
    },
    {
      target: '[data-tutorial="university-select"]',
      content: "Simply pick your university and all its available programmes will be reflected in the dropdown",
    },
    {
      target: '[data-id="apply-now"]',
      content: "Don't know how to write the best application?",
      requireClick: true,
      autoFill: {
        university: "National University of Singapore",
        degree: "Bachelor of Arts",
        major: "Anthropology"
      }
    },
    {
      target: '[data-tutorial="select-university"]',
      content: "Armed with your resume and personality, Adviseek AI can help you write an application to maximise your university enrollment chances",
    },
    {
      target: '[data-id="mock-interviews"]',
      content: "Afraid of the interview?",
      requireClick: true,
    },
    {
      target: '[data-tutorial="select-application"]',
      content: "Adviseek's got your back, Adviseek AI will dynamically make questions according to your profile and resume. Simply select one of your applications and Adviseek will do the rest!",
    },
    {
      target: '[data-id="get-paid"]',
      content: "Already a university student?",
      requireClick: true,
    },
    {
      target: '[data-tutorial="apply-consultant"]',
      content: "Help out a junior in need and you might just be rewarded ;)",
    },
    {
      target: '[data-tutorial="chat-with-ai"]',
      content: "Unsure about anything? Click right here to talk to Adviseek about anything under the sun",
    },
    {
      target: '[data-tutorial="send-feedback"]',
      content: "Unhappy about anything? Click here to tell us about any issues or suggestions, we appreciate all feedback",
    },
    {
      target: '[data-tutorial="follow-us"]',
      content: "Be sure to follow us on Instagram and Telegram for updates, giveaways and a community!",
    },
    {
      target: '[data-tutorial="profile-section"]',
      content: "Change your settings here, customize the display/functionality of the app to your own liking!",
    },
    {
      target: '[data-tutorial="adviseek-logo"]',
      content: "Don't leave your future to chance. Adviseek AI helps you figure out what you really want — and gives you the edge to get there. With aptitude-based admissions on the rise, your application needs more than just grades. It needs insight. Allow us to be the advise you seek",
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

  // Function to simulate clicking the highlighted element
  const simulateElementClick = useCallback(() => {
    if (!targetElement) return false;
    
    try {
      // Create and dispatch a click event
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      
      const clicked = targetElement.dispatchEvent(clickEvent);
      return clicked;
    } catch (error) {
      console.error("Error simulating click:", error);
      return false;
    }
  }, [targetElement]);

  // Function to auto-fill form fields
  const autoFillForm = useCallback((autoFill: Record<string, string>) => {
    try {
      Object.entries(autoFill).forEach(([fieldName, value]) => {
        // Try different selectors for form fields
        const selectors = [
          `[name="${fieldName}"]`,
          `[data-tutorial="${fieldName}-select"]`,
          `[placeholder*="${fieldName}"]`,
          `input[type="text"]:placeholder-contains("${fieldName}")`,
        ];

        let field: HTMLElement | null = null;
        for (const selector of selectors) {
          field = document.querySelector(selector);
          if (field) break;
        }

        if (field) {
          if (field instanceof HTMLSelectElement) {
            // Handle select elements
            for (let i = 0; i < field.options.length; i++) {
              if (field.options[i].text.includes(value) || field.options[i].value.includes(value)) {
                field.selectedIndex = i;
                const event = new Event('change', { bubbles: true });
                field.dispatchEvent(event);
                break;
              }
            }
          } else if (field instanceof HTMLInputElement) {
            // Handle input elements
            field.value = value;
            const event = new Event('input', { bubbles: true });
            field.dispatchEvent(event);
          }
        }
      });
    } catch (error) {
      console.error("Error auto-filling form:", error);
    }
  }, []);

  // Function to scroll to target
  const scrollToTarget = useCallback((selector: string) => {
    try {
      const element = document.querySelector(selector);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (error) {
      console.error("Error scrolling to target:", error);
    }
  }, []);

  // Handle next button click
  const handleNext = () => {
    const currentStepData = tutorialSteps[currentStep];
    
    // If this step requires clicking an element, simulate the click
    if (currentStepData?.requireClick) {
      simulateElementClick();
    }
    
    // If this step requires auto-filling, do it
    if (currentStepData?.autoFill) {
      setTimeout(() => {
        autoFillForm(currentStepData.autoFill!);
      }, 500); // Delay to allow navigation to complete
    }
    
    // If this step requires scrolling, do it
    if (currentStepData?.scrollTarget) {
      setTimeout(() => {
        scrollToTarget(currentStepData.scrollTarget!);
      }, 300);
    }
    
    // Advance to next step
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeAndClose();
    }
  };

  // Set up click handlers for elements requiring clicks (for backward compatibility)
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
          setCurrentStep(prev => prev + 1);
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
    
    // Delay position update to allow DOM to settle
    const timer = setTimeout(() => {
      updatePositions();
    }, 100);
    
    window.addEventListener("resize", updatePositions);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePositions);
    };
  }, [isOpen, currentStep, updatePositions]);

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
          maxWidth: "300px", // Increased for longer text
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
          {t("tutorial.step", "Step")} {currentStep + 1} {t("tutorial.of", "of")} {tutorialSteps.length}
        </p>
        
        <Progress value={progress} className="mb-3 h-1" />
        
        <p className="mb-4 dark:text-white text-sm leading-relaxed">{currentStepData?.content}</p>
        
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={handleSkip}>
            {t("tutorial.skip", "Skip Tutorial")}
          </Button>
          
          <Button size="sm" onClick={handleNext}>
            {currentStep < tutorialSteps.length - 1 ? t("tutorial.next", "Next") : t("tutorial.finish", "Finish")}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
