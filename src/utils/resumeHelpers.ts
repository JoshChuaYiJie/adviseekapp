
/**
 * Format template type for display
 * @param templateType 
 * @returns 
 */
export const formatTemplateType = (templateType: string): string => {
  // Template types are stored in lowercase with no spaces
  const formatted = templateType.charAt(0).toUpperCase() + templateType.slice(1);
  return `${formatted} Resume`;
};

/**
 * Get the localized template name using i18n translation
 */
export const useTranslatedTemplateType = (templateType: string): string => {
  // Add translation logic here if needed
  return formatTemplateType(templateType);
};
