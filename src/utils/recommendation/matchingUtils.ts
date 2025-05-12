
import { OccupationMajorMapping, MajorRecommendations } from './types';
import { sanitizeToFilename } from './fileUtils';

// Helper function to check if two codes are permutations of each other
export const arePermutations = (code1: string, code2: string): boolean => {
  if (code1.length !== code2.length) return false;
  
  const sortedCode1 = [...code1].sort().join('');
  const sortedCode2 = [...code2].sort().join('');
  
  return sortedCode1 === sortedCode2;
};

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
      questionFiles: [], // Initialize empty array for question files
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
    
    // If we have exact matches, set match type and generate question files
    if (result.exactMatches.length > 0) {
      result.matchType = 'exact';
      result.questionFiles = result.exactMatches.map(sanitizeToFilename);
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
    
    // If we have permutation matches, set match type and generate question files
    if (result.permutationMatches.length > 0) {
      result.matchType = 'permutation';
      result.questionFiles = result.permutationMatches.map(sanitizeToFilename);
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
    
    // If we have RIASEC matches, set match type and generate question files
    if (result.riasecMatches.length > 0) {
      result.matchType = 'riasec';
      result.questionFiles = result.riasecMatches.map(sanitizeToFilename);
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
    
    // If we have Work Value matches, set match type and generate question files
    if (result.workValueMatches.length > 0) {
      result.matchType = 'workValue';
      result.questionFiles = result.workValueMatches.map(sanitizeToFilename);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching major recommendations:', error);
    return {
      exactMatches: [],
      permutationMatches: [],
      riasecMatches: [],
      workValueMatches: [],
      questionFiles: [],
      riasecCode,
      workValueCode,
      matchType: 'none'
    };
  }
};
