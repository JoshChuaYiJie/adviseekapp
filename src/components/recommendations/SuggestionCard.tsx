
import { Button } from "@/components/ui/button";

interface SuggestionCardProps {
  onViewSuggestion: () => void;
  onRateMore: () => void;
}

export const SuggestionCard = ({ onViewSuggestion, onRateMore }: SuggestionCardProps) => {
  return (
    <div className="text-center animate-fade-in bg-white/80 shadow-lg p-8 rounded-2xl max-w-xl mx-auto">
      <h2 className="text-3xl font-bold mb-4 text-purple-700">Your suggested programme is ready!</h2>
      <p className="text-lg mb-8 text-gray-700">View it now or rate 30 more modules for a more refined suggestion</p>
      <div className="space-x-4">
        <Button 
          onClick={onViewSuggestion}
          className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold"
        >
          View suggestion
        </Button>
        <Button onClick={onRateMore} variant="outline" className="font-bold border-purple-200">Rate more modules</Button>
      </div>
    </div>
  );
};
