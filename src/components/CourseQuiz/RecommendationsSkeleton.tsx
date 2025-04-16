
import { Skeleton } from "@/components/ui/skeleton";

export const RecommendationsSkeleton = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(9).fill(0).map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-6">
            <Skeleton className="h-7 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-16 w-full mb-4" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-8" />
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
};
