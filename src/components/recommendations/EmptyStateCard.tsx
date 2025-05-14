
import { Button } from "@/components/ui/button";

interface EmptyStateCardProps {
  onBack: () => void;
}

export const EmptyStateCard = ({ onBack }: EmptyStateCardProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ede9fe] to-[#f3e8ff] text-gray-900 flex flex-col items-center justify-center p-8 font-open-sans">
      <h2 className="text-3xl font-bold mb-4">No Recommendations Available</h2>
      <p className="mb-8">We couldn't find any recommendations based on your responses.</p>
      <Button onClick={onBack}>Go Back</Button>
    </div>
  );
};
