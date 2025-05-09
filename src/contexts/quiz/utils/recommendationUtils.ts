
// Function to map RIASEC components to their codes
export const mapRiasecToCode = (component: string): string => {
  switch (component) {
    case 'R': return 'R';
    case 'I': return 'I';
    case 'A': return 'A';
    case 'S': return 'S';
    case 'E': return 'E';
    case 'C': return 'C';
    case 'Realistic': return 'R';
    case 'Investigative': return 'I';
    case 'Artistic': return 'A';
    case 'Social': return 'S';
    case 'Enterprising': return 'E';
    case 'Conventional': return 'C';
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

// Helper function to check if two codes are permutations of each other
export const arePermutations = (code1: string, code2: string): boolean => {
  if (code1.length !== code2.length) return false;
  
  const sortedCode1 = [...code1].sort().join('');
  const sortedCode2 = [...code2].sort().join('');
  
  return sortedCode1 === sortedCode2;
};

// Define interface for matched majors by category
export interface MajorRecommendations {
  exactMatches: string[];
  permutationMatches: string[];
  riasecMatches: string[];
  workValueMatches: string[];
  riasecCode: string;
  workValueCode: string;
  matchType: 'exact' | 'permutation' | 'riasec' | 'workValue' | 'none';
}

// Function to get matching majors based on RIASEC and Work Value codes with flexible matching
export const getMatchingMajors = async (
  riasecCode: string,
  workValueCode: string
): Promise<MajorRecommendations> => {
  try {
    // Fetch the occupation-major mappings
    const response = await fetch('/quiz_refer/occupation_major_mappings.json');
    if (!response.ok) {
      throw new Error('Failed to load occupation-major mappings');
    }

    const mappings = await response.json() as OccupationMajorMapping[];
    
    // Initialize result object
    const result: MajorRecommendations = {
      exactMatches: [],
      permutationMatches: [],
      riasecMatches: [],
      workValueMatches: [],
      riasecCode,
      workValueCode,
      matchType: 'none'
    };
    
    // 1. Find exact matches (both codes match exactly)
    const exactMatches = mappings.filter(occupation => 
      occupation.RIASEC_code === riasecCode && 
      occupation.work_value_code === workValueCode
    );
    
    exactMatches.forEach(occupation => {
      result.exactMatches.push(...occupation.majors);
    });
    
    // Remove duplicates
    result.exactMatches = [...new Set(result.exactMatches)];
    
    // If we have exact matches, return them
    if (result.exactMatches.length > 0) {
      result.matchType = 'exact';
      return result;
    }
    
    // 2. Find permutation matches (both codes are permutations)
    const permutationMatches = mappings.filter(occupation => 
      arePermutations(occupation.RIASEC_code, riasecCode) && 
      arePermutations(occupation.work_value_code, workValueCode)
    );
    
    permutationMatches.forEach(occupation => {
      result.permutationMatches.push(...occupation.majors);
    });
    
    // Remove duplicates
    result.permutationMatches = [...new Set(result.permutationMatches)];
    
    // If we have permutation matches, return them
    if (result.permutationMatches.length > 0) {
      result.matchType = 'permutation';
      return result;
    }
    
    // 3. Find RIASEC-only matches (exact or permutation)
    const riasecMatches = mappings.filter(occupation => 
      occupation.RIASEC_code === riasecCode || 
      arePermutations(occupation.RIASEC_code, riasecCode)
    );
    
    riasecMatches.forEach(occupation => {
      result.riasecMatches.push(...occupation.majors);
    });
    
    // Remove duplicates
    result.riasecMatches = [...new Set(result.riasecMatches)];
    
    // If we have RIASEC matches, return them
    if (result.riasecMatches.length > 0) {
      result.matchType = 'riasec';
      return result;
    }
    
    // 4. Find Work Value-only matches (exact or permutation)
    const workValueMatches = mappings.filter(occupation => 
      occupation.work_value_code === workValueCode || 
      arePermutations(occupation.work_value_code, workValueCode)
    );
    
    workValueMatches.forEach(occupation => {
      result.workValueMatches.push(...occupation.majors);
    });
    
    // Remove duplicates
    result.workValueMatches = [...new Set(result.workValueMatches)];
    
    // If we have Work Value matches, set the match type
    if (result.workValueMatches.length > 0) {
      result.matchType = 'workValue';
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching major recommendations:', error);
    return {
      exactMatches: [],
      permutationMatches: [],
      riasecMatches: [],
      workValueMatches: [],
      riasecCode,
      workValueCode,
      matchType: 'none'
    };
  }
};

// Mock recommendation generator (replacing Supabase calls)
export const generateRecommendations = async (userId: string): Promise<any[]> => {
  try {
    // This is a mock function that doesn't rely on database tables
    // that might not exist in the schema
    console.log("Generating mock recommendations for user:", userId);
    
    return [
      {
        id: 1,
        module_id: 101,
        reason: "Based on your interest in technology",
        user_id: userId,
        created_at: new Date().toISOString(),
        module: {
          id: 101,
          title: "Introduction to Computer Science",
          course_code: "CS101",
          university: "NUS",
          aus_cus: 4,
          semester: "2023-1",
          description: "A foundational course in computer science principles"
        }
      },
      {
        id: 2,
        module_id: 102,
        reason: "Matches your preference for analytical work",
        user_id: userId,
        created_at: new Date().toISOString(),
        module: {
          id: 102,
          title: "Data Structures and Algorithms",
          course_code: "CS201",
          university: "NUS",
          aus_cus: 4,
          semester: "2023-1",
          description: "Advanced concepts in data organization and processing"
        }
      }
    ];
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return [];
  }
};
