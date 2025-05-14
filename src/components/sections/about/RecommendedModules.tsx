

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";
import { Module } from "@/utils/recommendation/types";

interface RecommendedModulesProps {
  modules: Module[];
  isLoading: boolean;
}

export const RecommendedModules = ({ modules, isLoading }: RecommendedModulesProps) => {
  const { isCurrentlyDark } = useTheme();
  
  return (
    <div className="mt-8 mb-6">
      <h3 className="text-lg font-semibold mb-3">Recommended Courses</h3>
      <p className="mb-4">Based on your recommended majors, these courses might interest you:</p>
      
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
        </div>
      ) : modules.length > 0 ? (
        <div className="space-y-6">
          {modules.map((module, index) => (
            <div key={`module-${index}`} className={`p-4 rounded-lg ${isCurrentlyDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-medium text-sm text-blue-500">{module.institution}</span>
                  <h4 className="text-lg font-bold">{module.modulecode}: {module.title}</h4>
                </div>
                <Badge className="ml-2">{module.institution}</Badge>
              </div>
              <ModuleDescription description={module.description} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center py-4 italic">No course recommendations found for your profile.</p>
      )}
    </div>
  );
};

// Extract module description as a separate component
const ModuleDescription = ({ description }: { description: string }) => {
  const [expanded, setExpanded] = useState(false);
  const shouldTruncate = description.length > 200;
  
  return (
    <>
      <p className="text-sm mt-2">
        {expanded || !shouldTruncate 
          ? description
          : `${description.substring(0, 200)}...`}
      </p>
      {shouldTruncate && (
        <Button 
          variant="link" 
          className="p-0 h-auto text-sm mt-1"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show less" : "Read more"}
        </Button>
      )}
    </>
  );
};

