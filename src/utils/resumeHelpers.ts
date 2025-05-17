
import { useTranslation } from "react-i18next";

// Format template type for display
export const formatTemplateType = (templateType: string) => {
  switch (templateType) {
    case 'basic': return 'Basic Resume';
    case 'stem': return 'STEM Resume';
    case 'business': return 'Business Resume';
    case 'humanities': return 'Humanities Resume';
    case 'creative': return 'Creative Arts Resume';
    case 'health': return 'Health Sciences Resume';
    case 'education': return 'Education/Public Service Resume';
    default: return templateType.charAt(0).toUpperCase() + templateType.slice(1);
  }
};

// Format template type with translations
export const useTranslatedTemplateType = () => {
  const { t } = useTranslation();
  
  return (templateType: string) => {
    switch (templateType) {
      case 'basic': return t('resume.templates.basic', 'Basic Resume');
      case 'stem': return t('resume.templates.stem', 'STEM Resume');
      case 'business': return t('resume.templates.business', 'Business Resume');
      case 'humanities': return t('resume.templates.humanities', 'Humanities Resume');
      case 'creative': return t('resume.templates.creative', 'Creative Arts Resume');
      case 'health': return t('resume.templates.health', 'Health Sciences Resume');
      case 'education': return t('resume.templates.education', 'Education/Public Service Resume');
      default: return templateType.charAt(0).toUpperCase() + templateType.slice(1);
    }
  };
};
