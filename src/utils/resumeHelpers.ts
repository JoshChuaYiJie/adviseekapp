
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
