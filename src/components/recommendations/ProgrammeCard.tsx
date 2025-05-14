
import { Button } from "@/components/ui/button";

interface ProgrammeCardProps {
  onAcceptSuggestion: () => void;
  onRateMore: () => void;
}

export const ProgrammeCard = ({ onAcceptSuggestion, onRateMore }: ProgrammeCardProps) => {
  return (
    <div className="text-center animate-fade-in bg-white/80 shadow-lg p-8 rounded-2xl max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-4 text-purple-700">
        Your recommended programme is a degree in computer science in NUS with an optional major in economics
      </h2>
      <p className="text-lg mb-8 text-gray-700">
        Based on your responses, you demonstrate strong analytical skills and interest in technology.
        Your learning style and career goals align well with the computer science program at NUS.
      </p>
      <div className="space-x-4">
        <Button 
          onClick={onAcceptSuggestion} 
          className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold"
        >
          Accept suggestion
        </Button>
        <Button onClick={onRateMore} variant="outline" className="font-bold border-purple-200">Rate more suggestions</Button>
      </div>
    </div>
  );
};
