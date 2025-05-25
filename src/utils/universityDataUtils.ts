
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

// Mock data to use as fallback
const mockUniversityData: UniversityData = {
  programs: [
    {
      college: "School of Computing",
      major: "Computer Science",
      degree: "Bachelor of Computing",
      criteria: {
        eligibility: [{ qualificationType: "A-Level", description: "Good grades in mathematics" }],
        suitability: [{ criterion: "Technical aptitude", description: "Strong problem-solving skills", weight: 5 }]
      }
    },
    {
      college: "School of Business",
      major: "Business Analytics",
      degree: "Bachelor of Business",
      criteria: {
        eligibility: [{ qualificationType: "A-Level", description: "Good grades in mathematics and economics" }],
        suitability: [{ criterion: "Analytical thinking", description: "Strong data analysis skills", weight: 5 }]
      }
    }
  ]
};

// Function to load university data
export const loadUniversityData = async (university: string): Promise<UniversityData | null> => {
  // Normalize university name for file path
  const normalizedName = university.replace(/\s+/g, '').toLowerCase();
  
  // Check cache first
  if (dataCache[normalizedName]) {
    
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
        return mockUniversityData; // Return mock data instead of empty data
    }
    
    // We'll try different path strategies to load the file
    const fileStrategies = [
      // Strategy 1: Using the base URL of the site with no leading slash
      `${window.location.origin}/school-data/Standardized-weights/standardized_${shortName}_majors.json`,
      
      // Strategy 2: Relative path with just a leading slash
      `/school-data/Standardized-weights/standardized_${shortName}_majors.json`,
      
      // Strategy 3: Just the file path with no leading slash
      `school-data/Standardized-weights/standardized_${shortName}_majors.json`
    ];
    
    let data = null;
    let successPath = '';
    
    // Try each file loading strategy
    for (const filePath of fileStrategies) {
      try {
        
        const response = await fetch(filePath);
        
        if (!response.ok) {
          
          continue;
        }
        
        const fetchedData = await response.json();
        
        if (!fetchedData || !fetchedData.programs || !Array.isArray(fetchedData.programs)) {
          
          continue;
        }
        
        // If we got here, we have valid data
        data = fetchedData;
        successPath = filePath;
        break;
      } catch (error) {
        
        // Continue to next strategy
      }
    }
    
    if (data) {
      
      dataCache[normalizedName] = data;
      return data;
    }
    
    // If all strategies fail, use mock data
    console.error(`All file loading strategies failed for ${university}, using mock data`);
    return mockUniversityData;
  } catch (error) {
    console.error('Error in loadUniversityData:', error);
    return mockUniversityData; // Return mock data instead of null
  }
};

// Extract all degrees from university data
export const getDegrees = (data: UniversityData | null): string[] => {
  if (!data?.programs) {
    
    return [];
  }

  // Use Set to get unique degrees
  const degrees = new Set<string>();
  
  data.programs.forEach(program => {
    if (program.degree) {
      
      degrees.add(program.degree);
    }
  });

  // Convert Set to sorted array
  const uniqueDegrees = Array.from(degrees).sort();
  
  
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
