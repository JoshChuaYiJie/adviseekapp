
interface CompletionCardProps {
  message?: string;
}

export const CompletionCard = ({ message = "Thank you for your ratings!" }: CompletionCardProps) => {
  return (
    <div className="text-center animate-fade-in bg-white/80 shadow-lg p-8 rounded-2xl max-w-xl mx-auto">
      <h2 className="text-3xl font-bold mb-4 text-purple-700">{message}</h2>
      <p className="text-lg mb-8 text-gray-700">Redirecting to your dashboard...</p>
      <div className="flex justify-center">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
      </div>
    </div>
  );
};
