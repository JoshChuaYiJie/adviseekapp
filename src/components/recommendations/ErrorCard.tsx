
import { Button } from "@/components/ui/button";

interface ErrorCardProps {
  error: string;
  onBack: () => void;
}

export const ErrorCard = ({ error, onBack }: ErrorCardProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ede9fe] to-[#f3e8ff] text-gray-900 flex flex-col items-center justify-center p-8 font-open-sans">
      <h2 className="text-3xl font-bold text-red-400 mb-4">Error</h2>
      <p className="mb-8">{error}</p>
      <Button onClick={onBack}>Go Back</Button>
    </div>
  );
};
