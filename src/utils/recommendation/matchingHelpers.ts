
import { OccupationMajorMapping } from './types';

// Helper functions for finding different types of matches

export function findExactMatches(
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

export function findRiasecMatches(
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
      : (occupation.RIASEC_code === riasecCode);
    
    // Exclude exact matches we've already found
    const alreadyFound = (
      (occupation.RIASEC_code === riasecCode && occupation.work_value_code === workValueCode)
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

export function findWorkValueMatches(
  mappings: OccupationMajorMapping[], 
  riasecCode: string, 
  workValueCode: string
): string[] {
  // Find Work Value-only matches (exact match only, no permutations)
  const workValueMatches = mappings.filter(occupation => 
    occupation.work_value_code !== null &&
    occupation.work_value_code === workValueCode &&
    // Exclude matches we've already found
    !(
      (occupation.RIASEC_code === riasecCode && occupation.work_value_code === workValueCode) ||
      (occupation.RIASEC_code !== null && 
       ((occupation.RIASEC_code.length <= 2 && matchShortCode(occupation.RIASEC_code, riasecCode)) ||
        occupation.RIASEC_code === riasecCode))
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

// Import these from codeMatchingUtils since they're used in the functions above
import { arePermutations, matchShortCode } from './codeMatchingUtils';
