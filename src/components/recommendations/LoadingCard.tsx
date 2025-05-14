
interface LoadingCardProps {
  message?: string;
}

export const LoadingCard = ({ message = "Loading recommendations..." }: LoadingCardProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ede9fe] to-[#f3e8ff] text-gray-900 flex flex-col items-center justify-center p-8 font-open-sans">
      <div className="animate-spin w-12 h-12 border-t-2 border-purple-400 border-r-2 rounded-full mb-4"></div>
      <h2 className="text-2xl font-medium">{message}</h2>
    </div>
  );
};
