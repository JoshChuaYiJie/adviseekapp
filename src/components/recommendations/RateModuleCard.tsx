
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface RateModuleCardProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  onRate: () => void;
}

export const RateModuleCard = ({ rating, onRatingChange, onRate }: RateModuleCardProps) => {
  return (
    <div className="w-full max-w-md mt-8 bg-white/90 shadow-md rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">Not interested</span>
        <span className="font-bold text-xl text-purple-500">{rating}/10</span>
        <span className="text-sm font-medium text-gray-500">Very interested</span>
      </div>
      <Slider
        value={[rating]}
        min={1}
        max={10}
        step={1}
        onValueChange={([value]) => onRatingChange(value)}
        className="mb-6"
      />
      <Button 
        onClick={onRate}
        size="lg"
        className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-6 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        Rate and Continue
      </Button>
    </div>
  );
};
