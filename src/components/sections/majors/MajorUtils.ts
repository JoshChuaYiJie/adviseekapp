
// Format major name for file search
export const formatMajorForFile = (major: string, university: string): string => {
  // Remove university suffix if it exists and replace spaces with underscores
  const cleanMajor = major.replace(/ at (NUS|NTU|SMU)$/, '').replace(/\s+/g, '_');
  return `${cleanMajor}_${university}`;
};

// Format major name for display (remove university suffix if present)
export const formatMajorForDisplay = (major: string): string => {
  return major.replace(/ at (NUS|NTU|SMU)$/, '');
};

// Extract university name from major (if present)
export const extractUniversityFromMajor = (major: string): string => {
  const match = major.match(/ at (NUS|NTU|SMU)$/);
  return match ? match[1] : '';
};
