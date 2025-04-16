
import { Module } from '@/integrations/supabase/client';

interface ModuleRatingCardProps {
  module: Module | undefined;
  courseCode: string | undefined;
  description: string;
  reason: string;
  showAnimation: boolean;
}

export const ModuleRatingCard = ({ 
  module, 
  courseCode, 
  description, 
  reason, 
  showAnimation 
}: ModuleRatingCardProps) => {
  if (!module) return null;

  return (
    <div 
      className={`w-full max-w-2xl mx-auto text-center transition-all duration-700 ${
        showAnimation ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div className="mb-4 inline-block border border-white/30 rounded-full px-4 py-1 text-sm">
        NEW
      </div>
      
      <div className="text-xl uppercase tracking-wide mb-2">
        {courseCode || ""}
      </div>
      
      <h1 className="text-5xl md:text-7xl font-bold tracking-wider mb-6 uppercase">
        {module.title}
      </h1>
      
      <p className="text-lg mb-8 max-w-lg mx-auto">
        {description}
      </p>
      
      <div className="text-sm bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/10 italic mb-8">
        {reason}
      </div>
    </div>
  );
};
