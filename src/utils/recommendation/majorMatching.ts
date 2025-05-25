
import { OccupationMajorMapping, MajorRecommendations } from './types';
import { sanitizeToFilename } from './fileUtils';
import { 
  findExactMatches,
  findRiasecMatches,
  findWorkValueMatches
} from './matchingHelpers';

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
      permutationMatches: [], // Keep this for backward compatibility but don't use it
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
    
    // Find RIASEC-only matches (now the second priority)
    result.riasecMatches = findRiasecMatches(mappings, riasecCode, workValueCode);
    
    // If we have RIASEC matches and no exact matches, set match type and generate question files
    if (result.riasecMatches.length > 0 && result.matchType === 'none') {
      result.matchType = 'riasec';
      result.questionFiles = result.riasecMatches.map(sanitizeToFilename);
    }
    
    // Find Work Value-only matches (third priority)
    result.workValueMatches = findWorkValueMatches(mappings, riasecCode, workValueCode);
    
    // If we have Work Value matches and no previous matches, set match type and generate question files
    if (result.workValueMatches.length > 0 && result.matchType === 'none') {
      result.matchType = 'workValue';
      result.questionFiles = result.workValueMatches.map(sanitizeToFilename);
    }
    
    // Final logging to check results
    console.log('Final recommendation results:', {
      exactMatches: result.exactMatches.length,
      riasecMatches: result.riasecMatches.length,
      workValueMatches: result.workValueMatches.length,
      matchType: result.matchType
    });
    
    return result;
  } catch (error) {
    console.error('Error fetching major recommendations:', error);
    return {
      exactMatches: [],
      permutationMatches: [], // Keep empty array for backward compatibility
      riasecMatches: [],
      workValueMatches: [],
      questionFiles: [],
      riasecCode,
      workValueCode,
      matchType: 'none'
    };
  }
};
