
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

export const BuildResumeCard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
            onClick={() => navigate('/resumebuilder')}
            className="w-full"
          >
            {t('Create Resume')}
          </Button>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
