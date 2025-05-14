
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResumeTemplate } from "@/utils/resumeTemplates";

interface ResumeTemplateCardProps {
  template: ResumeTemplate;
  selectedTemplate: number | null;
  onSelectTemplate: (templateId: number) => void;
}

export const ResumeTemplateCard: React.FC<ResumeTemplateCardProps> = ({
  template,
  selectedTemplate,
  onSelectTemplate
}) => {
  return (
    <Card 
      className={`overflow-hidden transition-all hover:shadow-lg ${selectedTemplate === template.id ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div className={`h-2 ${template.color}`}></div>
      <CardHeader>
        <CardTitle>{template.name}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border">
          <img 
            src={template.thumbnail} 
            alt={`${template.name} template preview`}
            className="w-full h-auto object-cover aspect-[3/4] transition-transform hover:scale-105"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={() => onSelectTemplate(template.id)}
        >
          Use This Template
        </Button>
      </CardFooter>
    </Card>
  );
};
