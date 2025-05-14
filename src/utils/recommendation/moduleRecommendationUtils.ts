
import { MajorRecommendationsType } from '@/components/sections/majors/types';

export interface Module {
  modulecode: string;
  title: string;
  institution: "NUS" | "NTU" | "SMU";
  description: string;
}

/**
 * Fetches module recommendations based on the top recommended majors
 * @param recommendations The major recommendations object
 * @param limit The maximum number of majors to use (default: 5)
 * @returns A promise that resolves to an array of recommended modules
 */
export const fetchModuleRecommendations = async (
  recommendations: MajorRecommendationsType,
  limit = 5
): Promise<Module[]> => {
  try {
    // Get the combined list of all recommended majors
    const allMajors = [
      ...(recommendations.exactMatches || []),
      ...(recommendations.permutationMatches || []),
      ...(recommendations.riasecMatches || []),
      ...(recommendations.workValueMatches || [])
    ];
    
    // Take only unique majors by creating a Set and converting back to array
    const uniqueMajors = [...new Set(allMajors)];
    
    // Limit to the top N majors if specified
    const topMajors = limit > 0 ? uniqueMajors.slice(0, limit) : uniqueMajors;
    
    if (topMajors.length === 0) {
      console.log('No recommended majors found');
      return [];
    }
    
    console.log('Top recommended majors:', topMajors);
    
    // Load the mappings file
    const mappingsResponse = await fetch('/school-data/mappings.json');
    if (!mappingsResponse.ok) {
      throw new Error(`Failed to fetch mappings: ${mappingsResponse.status}`);
    }
    const mappings = await mappingsResponse.json();
    
    // Initialize array to store module recommendations
    const recommendedModules: Module[] = [];
    
    // Process each major to find relevant modules
    for (const major of topMajors) {
      // Determine which school (NUS, NTU, SMU) the major belongs to
      let school: "NUS" | "NTU" | "SMU" | "" = "";
      if (major.includes('at NUS')) {
        school = "NUS";
      } else if (major.includes('at NTU')) {
        school = "NTU";
      } else if (major.includes('at SMU')) {
        school = "SMU";
      } else {
        // If school is not specified, skip this major
        console.log(`School not specified for major: ${major}`);
        continue;
      }
      
      // Get the major name without the school suffix
      const majorName = major.replace(/ at (NUS|NTU|SMU)$/, '');
      
      // Find prefixes for this major based on the school
      let prefixes: string[] = [];
      if (school === 'NUS') {
        prefixes = findPrefixesForMajor(mappings.nus_prefix_to_major, majorName);
      } else if (school === 'NTU') {
        prefixes = findPrefixesForMajor(mappings.ntu_prefix_to_major, majorName);
      } else if (school === 'SMU') {
        prefixes = findPrefixesForMajor(mappings.smu_prefix_to_major, majorName);
      }
      
      if (prefixes.length === 0) {
        console.log(`No prefixes found for major: ${majorName} at ${school}`);
        continue;
      }
      
      console.log(`Found prefixes for ${majorName} at ${school}:`, prefixes);
      
      try {
        // Load the appropriate module data file with correct path
        const moduleDataResponse = await fetch(`/school-data/Module_code_and_description/Module_code_and_description_${school}.json`);
        if (!moduleDataResponse.ok) {
          console.error(`Failed to fetch module data for ${school}: ${moduleDataResponse.status}`);
          continue;
        }
        
        const moduleData = await moduleDataResponse.json();
        
        // Filter modules that match the prefixes
        const matchingModules = moduleData.filter((module: any) => {
          const moduleCode = module.modulecode.trim().toUpperCase();
          return prefixes.some(prefix => moduleCode.startsWith(prefix.trim().toUpperCase()));
        });
        
        console.log(`Found ${matchingModules.length} matching modules for ${majorName}`);
        
        // Add all matching modules for this major to our recommendations
        const majorModules = matchingModules.map((module: any) => ({
          ...module,
          institution: school // Ensure the institution property is correctly typed
        }));
        
        recommendedModules.push(...majorModules);
      } catch (err) {
        console.error(`Error loading module data for ${school}:`, err);
        continue; // Continue with the next major
      }
    }
    
    // Deduplicate modules based on modulecode
    const uniqueModules = [...new Map(recommendedModules.map(module => 
      [module.modulecode, module]
    )).values()];
    
    console.log(`Total unique modules found: ${uniqueModules.length}`);
    return uniqueModules;
  } catch (error) {
    console.error('Error fetching module recommendations:', error);
    return [];
  }
};

/**
 * Finds all prefixes in the mapping that correspond to a given major
 * @param prefixToMajorMap The prefix to major mapping object
 * @param majorName The name of the major to find prefixes for
 * @returns An array of prefixes for the given major
 */
const findPrefixesForMajor = (
  prefixToMajorMap: Record<string, string>,
  majorName: string
): string[] => {
  const prefixes: string[] = [];
  
  // Look through the mapping to find all prefixes that map to this major
  for (const [prefix, mappedMajor] of Object.entries(prefixToMajorMap)) {
    if (mappedMajor.toLowerCase() === majorName.toLowerCase()) {
      prefixes.push(prefix);
    }
  }
  
  return prefixes;
};
