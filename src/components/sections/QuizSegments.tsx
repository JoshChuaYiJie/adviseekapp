
import { TooltipProvider } from "@/components/ui/tooltip";
import { QuizSegmentsContainer } from "./quiz-segments/QuizSegmentsContainer";

export const QuizSegments = () => {
  return (
    <TooltipProvider>
      <QuizSegmentsContainer />
    </TooltipProvider>
  );
};
