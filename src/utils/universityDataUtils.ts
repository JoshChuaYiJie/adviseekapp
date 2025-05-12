
// Define types for the standardized university data
export interface Major {
  major: string;
  weight: number;
  college?: string;
}

export interface Degree {
  degree: string;
  majors: Major[];
}

export interface UniversityData {
  programs: {
    college: string;
    major: string;
    degree: string;
    criteria: {
      eligibility: Array<{
        qualificationType: string;
        description: string;
      }>;
      suitability: Array<{
        criterion: string;
        description: string;
        weight: number;
      }>;
    };
  }[];
}

// Cache for loaded university data
const dataCache: Record<string, UniversityData> = {};

// Function to load university data
export const loadUniversityData = async (university: string): Promise<UniversityData | null> => {
  // Normalize university name for file path
  const normalizedName = university.replace(/\s+/g, '').toLowerCase();
  
  // Check cache first
  if (dataCache[normalizedName]) {
    console.log(`Using cached data for ${university}`);
    return dataCache[normalizedName];
  }
  
  try {
    // Determine short name based on university
    let shortName = '';
    switch (normalizedName) {
      case 'nationaluniversityofsingapore':
      case 'nus':
        shortName = 'nus';
        break;
      case 'nanyangtechnologicaluniversity':
      case 'ntu':
        shortName = 'ntu';
        break;
      case 'singaporemanagementuniversity':
      case 'smu':
        shortName = 'smu';
        break;
      default:
        console.error('Unknown university:', university);
        return { programs: [] };
    }
    
    // Construct the file path
    const filePath = `/school-data/Standardized weights/standardized_${shortName}_majors.json`;
    
    console.log(`Fetching university data from ${filePath} for ${university}`);
    
    try {
      const response = await fetch(filePath);
      
      if (!response.ok) {
        console.error(`Failed to fetch data: HTTP ${response.status} for ${filePath}`);
        
        // Try with a different path format as fallback
        const fallbackPath = `/public/school-data/Standardized weights/standardized_${shortName}_majors.json`;
        console.log(`Trying fallback path: ${fallbackPath}`);
        
        const fallbackResponse = await fetch(fallbackPath);
        if (!fallbackResponse.ok) {
          throw new Error(`HTTP error! Status: ${response.status}, fallback status: ${fallbackResponse.status}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        dataCache[normalizedName] = fallbackData;
        return fallbackData;
      }
      
      const data = await response.json();
      console.log(`Successfully loaded data for ${university}`, data);
      
      if (!data || !data.programs || !Array.isArray(data.programs)) {
        throw new Error(`Invalid data format for ${university}`);
      }
      
      dataCache[normalizedName] = data;
      return data;
    } catch (error) {
      console.error(`Error loading university data for ${university} from ${filePath}:`, error);
      
      // Return empty data structure instead of null to prevent further errors
      return { programs: [] };
    }
  } catch (error) {
    console.error('Error in loadUniversityData:', error);
    return { programs: [] };
  }
};

// Extract all degrees from university data
export const getDegrees = (data: UniversityData | null): string[] => {
  if (!data?.programs) {
    console.log('No valid programs array in data:', data);
    return [];
  }

  // Use Set to get unique degrees
  const degrees = new Set<string>();
  
  data.programs.forEach(program => {
    if (program.degree) {
      console.log(`Found degree: ${program.degree}`);
      degrees.add(program.degree);
    }
  });

  // Convert Set to sorted array
  const uniqueDegrees = Array.from(degrees).sort();
  console.log('Total unique degrees found:', uniqueDegrees.length);
  
  return uniqueDegrees;
};

// Get all majors for a specific degree
export const getMajorsForDegree = (data: UniversityData | null, degree: string): Major[] => {
  if (!data || !Array.isArray(data.programs) || !degree) {
    return [];
  }
  
  const majors: Major[] = [];
  data.programs.forEach((program) => {
    if (program.degree === degree && program.major) {
      majors.push({
        major: program.major,
        weight: program.criteria?.suitability?.[0]?.weight ?? 1,
        college: program.college,
      });
    }
  });
  
  return majors.sort((a, b) => a.major.localeCompare(b.major));
};

// Get university short name
export const getUniversityShortName = (university: string): string => {
  if (university.includes('National University')) return 'NUS';
  if (university.includes('Nanyang')) return 'NTU';
  if (university.includes('Singapore Management')) return 'SMU';
  return university;
};
