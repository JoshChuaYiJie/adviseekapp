
import { OccupationMajorMapping, MajorRecommendations } from './types';
import { arePermutations, matchShortCode } from './codeMatchingUtils';
import { sanitizeToFilename } from './fileUtils';

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
    
    // Find exact matches
    result.exactMatches = findExactMatches(mappings, riasecCode, workValueCode);
    
    // If we have exact matches, set match type and generate question files
    if (result.exactMatches.length > 0) {
      result.matchType = 'exact';
      result.questionFiles = result.exactMatches.map(sanitizeToFilename);
    }
    
    // Find permutation matches
    result.permutationMatches = findPermutationMatches(mappings, riasecCode, workValueCode);
    
    // If we have permutation matches and no exact matches, set match type and generate question files
    if (result.permutationMatches.length > 0 && result.matchType === 'none') {
      result.matchType = 'permutation';
      result.questionFiles = result.permutationMatches.map(sanitizeToFilename);
    }
    
    // Find RIASEC-only matches
    result.riasecMatches = findRiasecMatches(mappings, riasecCode, workValueCode);
    
    // If we have RIASEC matches and no previous matches, set match type and generate question files
    if (result.riasecMatches.length > 0 && result.matchType === 'none') {
      result.matchType = 'riasec';
      result.questionFiles = result.riasecMatches.map(sanitizeToFilename);
    }
    
    // Find Work Value-only matches
    result.workValueMatches = findWorkValueMatches(mappings, riasecCode, workValueCode);
    
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

// Helper functions for finding different types of matches

function findExactMatches(
  mappings: OccupationMajorMapping[], 
  riasecCode: string, 
  workValueCode: string
): string[] {
  // Find exact matches (both codes match exactly)
  const exactMatches = mappings.filter(occupation => 
    occupation.RIASEC_code === riasecCode && 
    occupation.work_value_code === workValueCode &&
    occupation.RIASEC_code !== null &&
    occupation.work_value_code !== null
  );
  
  console.log(`Found ${exactMatches.length} exact matches`);
  
  // Take up to 3 occupation objects for exact matches
  const limitedExactMatches = exactMatches.slice(0, 3);
  
  // Extract unique majors from these occupation objects
  const majors: string[] = [];
  limitedExactMatches.forEach(occupation => {
    if (occupation.majors && Array.isArray(occupation.majors)) {
      majors.push(...occupation.majors);
    }
  });
  
  // Remove duplicates
  return [...new Set(majors)];
}

function findPermutationMatches(
  mappings: OccupationMajorMapping[], 
  riasecCode: string, 
  workValueCode: string
): string[] {
  // Find permutation matches (both codes are permutations)
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
  
  // Extract unique majors from these occupation objects
  const majors: string[] = [];
  limitedPermutationMatches.forEach(occupation => {
    if (occupation.majors && Array.isArray(occupation.majors)) {
      majors.push(...occupation.majors);
    }
  });
  
  // Remove duplicates
  return [...new Set(majors)];
}

function findRiasecMatches(
  mappings: OccupationMajorMapping[], 
  riasecCode: string, 
  workValueCode: string
): string[] {
  // Find RIASEC-only matches with enhanced matching for short codes
  const riasecMatches = mappings.filter(occupation => {
    // Skip if RIASEC code is null
    if (occupation.RIASEC_code === null) return false;
    
    // For short codes (1-2 letters), use the matching function
    const isShortCode = occupation.RIASEC_code.length <= 2;
    
    const riasecMatch = isShortCode 
      ? matchShortCode(occupation.RIASEC_code, riasecCode)
      : (occupation.RIASEC_code === riasecCode || arePermutations(occupation.RIASEC_code, riasecCode));
    
    // Exclude matches we've already found
    const alreadyFound = (
      (occupation.RIASEC_code === riasecCode && occupation.work_value_code === workValueCode) ||
      (occupation.work_value_code !== null && arePermutations(occupation.RIASEC_code, riasecCode) && 
       arePermutations(occupation.work_value_code, workValueCode))
    );
    
    return riasecMatch && !alreadyFound;
  });
  
  console.log(`Found ${riasecMatches.length} RIASEC-only matches (including short code matches)`);
  
  // Take up to 3 occupation objects for RIASEC matches
  const limitedRiasecMatches = riasecMatches.slice(0, 3);
  
  // Extract unique majors from these occupation objects
  const majors: string[] = [];
  limitedRiasecMatches.forEach(occupation => {
    if (occupation.majors && Array.isArray(occupation.majors)) {
      majors.push(...occupation.majors);
    }
  });
  
  // Remove duplicates
  return [...new Set(majors)];
}

function findWorkValueMatches(
  mappings: OccupationMajorMapping[], 
  riasecCode: string, 
  workValueCode: string
): string[] {
  // Find Work Value-only matches (exact or permutation)
  const workValueMatches = mappings.filter(occupation => 
    occupation.work_value_code !== null &&
    (occupation.work_value_code === workValueCode || arePermutations(occupation.work_value_code, workValueCode)) &&
    // Exclude matches we've already found
    !(
      (occupation.RIASEC_code === riasecCode && occupation.work_value_code === workValueCode) ||
      (occupation.RIASEC_code !== null && arePermutations(occupation.RIASEC_code, riasecCode) && 
       arePermutations(occupation.work_value_code, workValueCode)) ||
      (occupation.RIASEC_code !== null && 
       ((occupation.RIASEC_code.length <= 2 && matchShortCode(occupation.RIASEC_code, riasecCode)) ||
        occupation.RIASEC_code === riasecCode || 
        arePermutations(occupation.RIASEC_code, riasecCode)))
    )
  );
  
  console.log(`Found ${workValueMatches.length} Work Value-only matches`);
  
  // Take up to 3 occupation objects for Work Value matches
  const limitedWorkValueMatches = workValueMatches.slice(0, 3);
  
  // Extract unique majors from these occupation objects
  const majors: string[] = [];
  limitedWorkValueMatches.forEach(occupation => {
    if (occupation.majors && Array.isArray(occupation.majors)) {
      majors.push(...occupation.majors);
    }
  });
  
  // Remove duplicates
  return [...new Set(majors)];
}

// Remove the sanitizeToFilename export from here since we're importing it from fileUtils
