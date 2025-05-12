
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
    degree: string;
    major: string;
    weight: number;
    college?: string;
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
    // Determine file path based on university
    let filePath = '';
    switch (normalizedName) {
      case 'nationaluniversityofsingapore':
      case 'nus':
        filePath = './school-data/Standardized weights/standardized_nus_majors.json';
        break;
      case 'nanyangtechnologicaluniversity':
      case 'ntu':
        filePath = './school-data/Standardized weights/standardized_ntu_majors.json';
        break;
      case 'singaporemanagementuniversity':
      case 'smu':
        filePath = './school-data/Standardized weights/standardized_smu_majors.json';
        break;
      default:
        console.error('Unknown university:', university);
        return null;
    }
    
    console.log(`Fetching university data from ${filePath} for ${university}`);
    
    // Add error handling with detailed logging
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Successfully loaded data for ${university}`, data);
      
      if (!data || !data.programs || !Array.isArray(data.programs)) {
        console.error(`Invalid data format for ${university}:`, data);
        return { programs: [] };
      }
      
      dataCache[normalizedName] = data;
      return data;
    } catch (error) {
      console.error(`Error loading university data for ${university} from ${filePath}:`, error);
      
      // Return a default empty structure instead of null
      return { programs: [] };
    }
  } catch (error) {
    console.error('Error in loadUniversityData:', error);
    return { programs: [] };
  }
};

// Extract all degrees from university data
export const getDegrees = (data: UniversityData | null): string[] => {
  if (!data || !Array.isArray(data.programs)) {
    console.log('No valid programs array in data:', data);
    return [];
  }
  
  const degrees = new Set<string>();
  data.programs.forEach((program) => {
    if (program.degree) {
      degrees.add(program.degree);
      console.log(`Added degree: ${program.degree}`);
    }
  });
  
  const result = Array.from(degrees).sort();
  console.log(`Found ${result.length} unique degrees:`, result);
  return result;
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
        weight: program.weight ?? 1,
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
