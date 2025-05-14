
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ResumeBuilderHeaderProps {
  title: string;
  subtitle?: string;
}

export const ResumeBuilderHeader: React.FC<ResumeBuilderHeaderProps> = ({
  title,
  subtitle
}) => {
  const navigate = useNavigate();
  
  return (
    <>
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      
      {subtitle && (
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-2">Choose a Template</h2>
          <p className="text-muted-foreground">
            {subtitle}
          </p>
        </div>
      )}
    </>
  );
};
