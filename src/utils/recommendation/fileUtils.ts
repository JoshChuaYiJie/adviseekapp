
// Function to sanitize major names to filenames following Python's conventions
export const sanitizeToFilename = (majorName: string): string => {
  // Extract university if it's in the format "Major at University"
  let university = '';
  const atUniversityMatch = majorName.match(/(.*?)\s+at\s+(\w+)$/i);
  
  if (atUniversityMatch) {
    majorName = atUniversityMatch[1];
    university = atUniversityMatch[2];
  } else {
    // Try to extract known university abbreviations from the end
    const uniMatches = majorName.match(/(.*?)\s+(NUS|NTU|SMU)$/);
    if (uniMatches) {
      majorName = uniMatches[1];
      university = uniMatches[2];
    }
  }
  
  // Replace special characters and standardize
  let sanitized = majorName
    .replace(/&/g, 'and')                    // Replace & with 'and'
    .replace(/[^\w\s]/g, '')                // Remove special characters
    .trim()                                 // Remove leading/trailing spaces
    .replace(/\s+/g, '_');                  // Replace spaces with underscores
  
  // Add the university if we have one
  if (university) {
    sanitized += `_${university}`;
  }
  
  return `${sanitized}.json`;
};
