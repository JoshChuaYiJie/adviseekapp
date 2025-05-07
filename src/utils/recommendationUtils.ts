
// Function to map RIASEC components to their codes
export const mapRiasecToCode = (component: string): string => {
  switch (component) {
    case 'R': return 'R';
    case 'I': return 'I';
    case 'A': return 'A';
    case 'S': return 'S';
    case 'E': return 'E';
    case 'C': return 'C';
    default: return '';
  }
};

// Function to map Work Value components to their codes
export const mapWorkValueToCode = (component: string): string => {
  switch (component) {
    case 'Achievement': return 'A';
    case 'Relationships': return 'R';
    case 'Independence': return 'I';
    case 'Recognition': return 'Rc';
    case 'Working Conditions': return 'W';
    case 'Support': return 'S';
    case 'Altruism': return 'Al';
    default: return '';
  }
};

// Function to form a code from component list
export const formCode = (components: Array<{ component: string; average: number; score: number }>, 
                          mapper: (component: string) => string): string => {
  return components
    .slice(0, 3) // Take top 3
    .map(item => mapper(item.component))
    .join('');
};

// Interface for occupation major mappings
export interface OccupationMajorMapping {
  occupation: string;
  RIASEC_code: string;
  work_value_code: string;
  majors: string[];
}

// Function to get matching majors based on RIASEC and Work Value codes
export const getMatchingMajors = async (
  riasecCode: string,
  workValueCode: string
): Promise<string[]> => {
  try {
    // Fetch the occupation-major mappings
    const response = await fetch('/quiz_refer/occupation_major_mappings.json');
    if (!response.ok) {
      throw new Error('Failed to load occupation-major mappings');
    }

    const mappings = await response.json() as OccupationMajorMapping[];
    
    // Find all occupations with matching codes
    const matchingOccupations = mappings.filter(occupation => 
      occupation.RIASEC_code === riasecCode && 
      occupation.work_value_code === workValueCode
    );

    // Extract all majors from matching occupations
    const allMajors: string[] = [];
    matchingOccupations.forEach(occupation => {
      allMajors.push(...occupation.majors);
    });

    // Remove duplicates
    const uniqueMajors = Array.from(new Set(allMajors));
    
    return uniqueMajors;
  } catch (error) {
    console.error('Error fetching major recommendations:', error);
    return [];
  }
};
