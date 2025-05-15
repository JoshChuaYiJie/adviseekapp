
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export const BuildResumeCard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleCreateResume = () => {
    // Navigate to the resume builder page with a basic template
    navigate('/resumebuilder/basic');
    
    // For debugging purposes, show a toast to track navigation
    console.log("Navigating to resume builder page with basic template");
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClipboardEdit className="mr-2 h-5 w-5" />
            {t('Build a Resume')}
          </CardTitle>
          <CardDescription>
            {t('Create a new resume using our interactive builder')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleCreateResume}
            className="w-full"
          >
            {t('Create Resume')}
          </Button>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
