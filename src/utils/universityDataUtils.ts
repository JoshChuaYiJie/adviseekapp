
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
export const getDegrees = (data: UniversityData): string[] => {
  if (!data) return [];
  
  const degrees: string[] = [];
  Object.keys(data).forEach(key => {
    data[key].forEach(degreeData => {
      if (!degrees.includes(degreeData.degree)) {
        degrees.push(degreeData.degree);
      }
    });
  });
  
  return degrees.sort();
};

// Get all majors for a specific degree
export const getMajorsForDegree = (data: UniversityData, degree: string): Major[] => {
  if (!data || !degree) return [];
  
  const majors: Major[] = [];
  Object.keys(data).forEach(key => {
    const degreeData = data[key].find(d => d.degree === degree);
    if (degreeData && degreeData.majors) {
      majors.push(...degreeData.majors);
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
