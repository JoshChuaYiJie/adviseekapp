
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, FileEdit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

export interface SavedResume {
  id: string;
  name: string;
  template_type: string;
  updated_at: string;
}

interface ResumeTableProps {
  loading: boolean;
  savedResumes: SavedResume[];
  resumeFiles: File[];
  onViewResume: (id: string, templateType: string) => void;
  onEditResume: (id: string, templateType: string) => void;
  onEditPDF: (index: number) => void;
}

export const ResumeTable: React.FC<ResumeTableProps> = ({
  loading,
  savedResumes,
  resumeFiles,
  onViewResume,
  onEditResume,
  onEditPDF
}) => {
  const { t } = useTranslation();
  
  if (loading) {
    return (
      <div className="w-full space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (savedResumes.length === 0 && resumeFiles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{t('No resumes found. Create or upload one to get started.')}</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">{t('Your Resumes')}</h3>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Name')}</TableHead>
              <TableHead>{t('Type')}</TableHead>
              <TableHead>{t('Last Updated')}</TableHead>
              <TableHead className="text-right">{t('Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {savedResumes.map((resume) => (
              <TableRow key={resume.id}>
                <TableCell className="font-medium">{resume.name}</TableCell>
                <TableCell>{resume.template_type}</TableCell>
                <TableCell>{resume.updated_at}</TableCell>
                <TableCell className="text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mr-1"
                          onClick={() => onViewResume(resume.id, resume.template_type)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('View')}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditResume(resume.id, resume.template_type)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('Edit')}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
            {resumeFiles.map((file, index) => (
              <TableRow key={`file-${index}`}>
                <TableCell className="font-medium">{file.name}</TableCell>
                <TableCell>PDF Upload</TableCell>
                <TableCell>Just now</TableCell>
                <TableCell className="text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => onEditPDF(index)}
                        >
                          <FileEdit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('Edit')}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
