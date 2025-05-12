
import { OccupationMajorMapping, MajorRecommendations } from './types';
import { sanitizeToFilename } from './fileUtils';

// Helper function to check if two codes are permutations of each other
// Added null checks to prevent errors when dealing with null codes
export const arePermutations = (code1: string | null, code2: string | null): boolean => {
  // If either code is null or undefined, they are not permutations
  if (!code1 || !code2) return false;
  
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
    console.log(`Searching for majors matching RIASEC: ${riasecCode}, Work Values: ${workValueCode}`);
    
    // Fetch the occupation-major mappings
    const response = await fetch('/quiz_refer/occupation_major_mappings.json');
    if (!response.ok) {
      throw new Error('Failed to load occupation-major mappings');
    }

    const mappings = await response.json() as OccupationMajorMapping[];
    console.log(`Loaded ${mappings.length} occupation-major mappings`);
    
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
    // Added null checks to handle records with null codes
    const exactMatches = mappings.filter(occupation => 
      occupation.RIASEC_code === riasecCode && 
      occupation.work_value_code === workValueCode &&
      occupation.RIASEC_code !== null &&
      occupation.work_value_code !== null
    );
    
    console.log(`Found ${exactMatches.length} exact matches`);
    
    // Take up to 3 occupation objects for exact matches
    const limitedExactMatches = exactMatches.slice(0, 3);
    
    // Extract majors from these occupation objects
    limitedExactMatches.forEach(occupation => {
      if (occupation.majors && Array.isArray(occupation.majors)) {
        result.exactMatches.push(...occupation.majors);
      }
    });
    
    // Remove duplicates
    result.exactMatches = [...new Set(result.exactMatches)];
    
    // If we have exact matches, set match type, generate question files, but CONTINUE to collect other matches
    if (result.exactMatches.length > 0) {
      result.matchType = 'exact';
      result.questionFiles = result.exactMatches.map(sanitizeToFilename);
    }
    
    // 2. Find permutation matches (both codes are permutations)
    // Updated with null checks to handle null codes
    const permutationMatches = mappings.filter(occupation => 
      occupation.RIASEC_code !== null &&
      occupation.work_value_code !== null &&
      arePermutations(occupation.RIASEC_code, riasecCode) && 
      arePermutations(occupation.work_value_code, workValueCode) &&
      // Exclude exact matches we've already found
      !(occupation.RIASEC_code === riasecCode && occupation.work_value_code === workValueCode)
    );
    
    console.log(`Found ${permutationMatches.length} permutation matches`);
    
    // Take up to 3 occupation objects for permutation matches
    const limitedPermutationMatches = permutationMatches.slice(0, 3);
    
    // Extract majors from these occupation objects
    limitedPermutationMatches.forEach(occupation => {
      if (occupation.majors && Array.isArray(occupation.majors)) {
        result.permutationMatches.push(...occupation.majors);
      }
    });
    
    // Remove duplicates
    result.permutationMatches = [...new Set(result.permutationMatches)];
    
    // If we have permutation matches and no exact matches, set match type and generate question files
    if (result.permutationMatches.length > 0 && result.matchType === 'none') {
      result.matchType = 'permutation';
      result.questionFiles = result.permutationMatches.map(sanitizeToFilename);
    }
    
    // 3. Find RIASEC-only matches (exact or permutation)
    // Updated with null checks to handle null codes
    const riasecMatches = mappings.filter(occupation => 
      occupation.RIASEC_code !== null &&
      (occupation.RIASEC_code === riasecCode || arePermutations(occupation.RIASEC_code, riasecCode)) &&
      // Exclude matches we've already found
      !(
        (occupation.RIASEC_code === riasecCode && occupation.work_value_code === workValueCode) ||
        (arePermutations(occupation.RIASEC_code, riasecCode) && occupation.work_value_code !== null && arePermutations(occupation.work_value_code, workValueCode))
      )
    );
    
    console.log(`Found ${riasecMatches.length} RIASEC-only matches`);
    
    // Take up to 3 occupation objects for RIASEC matches
    const limitedRiasecMatches = riasecMatches.slice(0, 3);
    
    // Extract majors from these occupation objects
    limitedRiasecMatches.forEach(occupation => {
      if (occupation.majors && Array.isArray(occupation.majors)) {
        result.riasecMatches.push(...occupation.majors);
      }
    });
    
    // Remove duplicates
    result.riasecMatches = [...new Set(result.riasecMatches)];
    
    // If we have RIASEC matches and no previous matches, set match type and generate question files
    if (result.riasecMatches.length > 0 && result.matchType === 'none') {
      result.matchType = 'riasec';
      result.questionFiles = result.riasecMatches.map(sanitizeToFilename);
    }
    
    // 4. Find Work Value-only matches (exact or permutation)
    // Updated with null checks to handle null codes
    const workValueMatches = mappings.filter(occupation => 
      occupation.work_value_code !== null &&
      (occupation.work_value_code === workValueCode || arePermutations(occupation.work_value_code, workValueCode)) &&
      // Exclude matches we've already found
      !(
        (occupation.RIASEC_code === riasecCode && occupation.work_value_code === workValueCode) ||
        (occupation.RIASEC_code !== null && arePermutations(occupation.RIASEC_code, riasecCode) && arePermutations(occupation.work_value_code, workValueCode)) ||
        (occupation.RIASEC_code !== null && (occupation.RIASEC_code === riasecCode || arePermutations(occupation.RIASEC_code, riasecCode)))
      )
    );
    
    console.log(`Found ${workValueMatches.length} Work Value-only matches`);
    
    // Take up to 3 occupation objects for Work Value matches
    const limitedWorkValueMatches = workValueMatches.slice(0, 3);
    
    // Extract majors from these occupation objects
    limitedWorkValueMatches.forEach(occupation => {
      if (occupation.majors && Array.isArray(occupation.majors)) {
        result.workValueMatches.push(...occupation.majors);
      }
    });
    
    // Remove duplicates
    result.workValueMatches = [...new Set(result.workValueMatches)];
    
    // If we have Work Value matches and no previous matches, set match type and generate question files
    if (result.workValueMatches.length > 0 && result.matchType === 'none') {
      result.matchType = 'workValue';
      result.questionFiles = result.workValueMatches.map(sanitizeToFilename);
    }
    
    // Final logging to check results
    console.log('Final recommendation results:', {
      exactMatches: result.exactMatches.length,
      permutationMatches: result.permutationMatches.length,
      riasecMatches: result.riasecMatches.length,
      workValueMatches: result.workValueMatches.length,
      matchType: result.matchType
    });
    
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
