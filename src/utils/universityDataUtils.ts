
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
    
    // Construct the correct file path
    const filePath = `/school-data/Standardized weights/standardized_${shortName}_majors.json`;
    
    console.log(`Fetching university data from ${filePath} for ${university}`);
    
    try {
      const response = await fetch(filePath);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
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
      throw error; // Re-throw the error so it can be handled by the caller
    }
  } catch (error) {
    console.error('Error in loadUniversityData:', error);
    throw error; // Re-throw the error so it can be handled by the caller
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
