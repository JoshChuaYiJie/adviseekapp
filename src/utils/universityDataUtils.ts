
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
  [key: string]: Degree[];
}

// Cache for loaded university data
const dataCache: Record<string, UniversityData> = {};

// Function to load university data
export const loadUniversityData = async (university: string): Promise<UniversityData | null> => {
  // Normalize university name for file path
  const normalizedName = university.replace(/\s+/g, '').toLowerCase();
  
  // Check cache first
  if (dataCache[normalizedName]) {
    return dataCache[normalizedName];
  }
  
  try {
    // Determine file path based on university
    let filePath = '';
    switch (normalizedName) {
      case 'nationaluniversityofsingapore':
      case 'nus':
        filePath = '/school-data/Standardized weights/standardized_nus_majors.json';
        break;
      case 'nanyangtechnologicaluniversity':
      case 'ntu':
        filePath = '/school-data/Standardized weights/standardized_ntu_majors.json';
        break;
      case 'singaporemanagementuniversity':
      case 'smu':
        filePath = '/school-data/Standardized weights/standardized_smu_majors.json';
        break;
      default:
        console.error('Unknown university:', university);
        return null;
    }
    
    // Load data
    const response = await fetch(filePath);
    if (!response.ok) {
      console.error('Failed to load university data:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    dataCache[normalizedName] = data;
    return data;
  } catch (error) {
    console.error('Error loading university data:', error);
    return null;
  }
};

// Extract all degrees from university data
// Extract all degrees from university data (expects { programs: [...] })
export const getDegrees = (data: any): string[] => {
  if (!data || !Array.isArray(data.programs)) return [];
  const degrees = new Set<string>();
  data.programs.forEach((program: any) => {
    if (program.degree) degrees.add(program.degree);
  });
  return Array.from(degrees).sort();
};

// Get all majors for a specific degree (expects { programs: [...] })
export const getMajorsForDegree = (data: any, degree: string): Major[] => {
  if (!data || !Array.isArray(data.programs) || !degree) return [];
  const majors: Major[] = [];
  data.programs.forEach((program: any) => {
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
