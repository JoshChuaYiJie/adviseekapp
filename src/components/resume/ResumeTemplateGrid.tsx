
import React from 'react';
import { ResumeTemplateCard } from './ResumeTemplateCard';
import { resumeTemplates } from '@/utils/resumeTemplates';

interface ResumeTemplateGridProps {
  selectedTemplate: number | null;
  onSelectTemplate: (templateId: number) => void;
}

export const ResumeTemplateGrid: React.FC<ResumeTemplateGridProps> = ({
  selectedTemplate,
  onSelectTemplate
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {resumeTemplates.map((template) => (
        <ResumeTemplateCard 
          key={template.id}
          template={template}
          selectedTemplate={selectedTemplate}
          onSelectTemplate={onSelectTemplate}
        />
      ))}
    </div>
  );
};
