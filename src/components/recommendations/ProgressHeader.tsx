
interface ProgressHeaderProps {
  currentIndex: number;
  totalModules: number;
}

export const ProgressHeader = ({ currentIndex, totalModules }: ProgressHeaderProps) => {
  return (
    <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-md border-b border-purple-100 p-4 shadow-sm">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-purple-700 font-poppins drop-shadow-sm">Module Recommendations</h1>
        <div className="text-lg font-medium text-purple-400">
          {currentIndex + 1} of {totalModules} modules
        </div>
      </div>
      <div className="container mx-auto mt-2">
        <div className="h-1 bg-purple-100 rounded-full">
          <div 
            className="h-full bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${((currentIndex + 1) / totalModules) * 100}%` }}
          ></div>
        </div>
      </div>
    </header>
  );
};
