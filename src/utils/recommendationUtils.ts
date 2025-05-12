
// Function to map RIASEC components to their codes
import { Module, Recommendation } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/contexts/quiz/utils/databaseHelpers";

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

// Function to form a code from component list - now respects the order provided
export const formCode = (components: Array<{ component: string; average: number; score: number }>, 
                          mapper: (component: string) => string): string => {
  // The components array is already sorted by score in descending order from QuizSegments.tsx
  // So we just need to take the first 3 and map them to their codes
  return components
    .slice(0, 3) // Take top 3 highest scoring components
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
  questionFiles: string[]; // New field for sanitized filenames
  riasecCode: string;
  workValueCode: string;
  matchType: 'exact' | 'permutation' | 'riasec' | 'workValue' | 'none';
}

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

// Generate recommendations based on user responses
export const generateRecommendationsUtil = async (
  userId: string,
  modules: Module[]
): Promise<Recommendation[]> => {
  try {
    // Mock implementation that returns sample recommendations
    const recommendations: Recommendation[] = modules.slice(0, 5).map(module => ({
      id: Math.floor(Math.random() * 10000),
      user_id: userId,
      module_id: module.id,
      reason: "Recommended based on your profile",
      created_at: new Date().toISOString(),
      module
    }));
    
    return recommendations;
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return [];
  }
};

// Load user feedback (ratings)
export const loadUserFeedbackUtil = async (userId: string): Promise<Record<number, number>> => {
  try {
    const { data, error } = await supabase
      .from('user_feedback')
      .select('module_id, rating')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Convert to Record<number, number>
    const feedback: Record<number, number> = {};
    if (data) {
      data.forEach(item => {
        feedback[item.module_id] = item.rating;
      });
    }
    
    return feedback;
  } catch (error) {
    console.error("Error loading user feedback:", error);
    return {};
  }
};

// Load recommendations
export const loadRecommendationsUtil = async (userId: string): Promise<Recommendation[]> => {
  try {
    // In a real implementation, we would fetch from the database
    // For now, we'll mock with sample data
    const modules = await fetchModulesMock();
    return generateRecommendationsUtil(userId, modules);
  } catch (error) {
    console.error("Error loading recommendations:", error);
    return [];
  }
};

// Rate a module
export const rateModuleUtil = async (moduleId: number, rating: number): Promise<void> => {
  try {
    const userId = await getUserId();
    if (!userId) {
      throw new Error("User not authenticated");
    }
    
    const { error } = await supabase
      .from('user_feedback')
      .upsert({
        user_id: userId,
        module_id: moduleId,
        rating
      }, {
        onConflict: 'user_id,module_id'
      });
    
    if (error) throw error;
  } catch (error) {
    console.error("Error rating module:", error);
    throw error;
  }
};

// Refine recommendations
export const refineRecommendationsUtil = async (
  userId: string,
  modules: Module[],
  excludeModuleIds: number[] = []
): Promise<void> => {
  // In a real implementation, this would use algorithm to refine recommendations
  console.log(`Refining recommendations for ${userId}, excluding ${excludeModuleIds.length} modules`);
};

// Get final selections
export const getFinalSelectionsUtil = async (
  userId: string, 
  recommendations: Recommendation[],
  userFeedback: Record<number, number>
): Promise<Module[]> => {
  try {
    // Filter to highly rated modules (7+)
    const highlyRated = recommendations.filter(rec => 
      userFeedback[rec.module_id] >= 7
    );
    
    // Sort by rating (highest first)
    highlyRated.sort((a, b) => 
      (userFeedback[b.module_id] || 0) - (userFeedback[a.module_id] || 0)
    );
    
    // Take top 5 or fewer
    return highlyRated.slice(0, 5).map(rec => rec.module);
  } catch (error) {
    console.error("Error getting final selections:", error);
    return [];
  }
};

// Helper function to fetch modules (mock)
const fetchModulesMock = async (): Promise<Module[]> => {
  return [
    {
      id: 1,
      university: "NUS",
      course_code: "CS1101S",
      title: "Programming Methodology",
      aus_cus: 4,
      semester: "1",
      description: "This module introduces the concepts of programming and computational problem-solving."
    },
    {
      id: 2,
      university: "NUS",
      course_code: "CS2030",
      title: "Programming Methodology II",
      aus_cus: 4,
      semester: "1",
      description: "This module continues the introduction to programming methodology."
    }
  ] as Module[];
};
