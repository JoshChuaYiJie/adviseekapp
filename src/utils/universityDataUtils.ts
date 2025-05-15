
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
    },
    {
      college: "Faculty of Arts and Social Sciences",
      major: "Psychology",
      degree: "Bachelor of Arts",
      criteria: {
        eligibility: [{ qualificationType: "A-Level", description: "Good grades in humanities subjects" }],
        suitability: [{ criterion: "Empathy", description: "Strong interpersonal skills", weight: 5 }]
      }
    },
    {
      college: "School of Engineering",
      major: "Mechanical Engineering",
      degree: "Bachelor of Engineering",
      criteria: {
        eligibility: [{ qualificationType: "A-Level", description: "Good grades in physics and mathematics" }],
        suitability: [{ criterion: "Problem solving", description: "Strong analytical skills", weight: 5 }]
      }
    },
    {
      college: "Faculty of Science",
      major: "Chemistry",
      degree: "Bachelor of Science",
      criteria: {
        eligibility: [{ qualificationType: "A-Level", description: "Good grades in chemistry and mathematics" }],
        suitability: [{ criterion: "Precision", description: "Attention to detail", weight: 5 }]
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
        console.log('Falling back to mock data for:', university);
        dataCache[normalizedName] = mockUniversityData;
        return mockUniversityData;
    }
    
    console.log(`Using mock data for ${university} due to file loading issues`);
    dataCache[normalizedName] = mockUniversityData;
    return mockUniversityData;
  } catch (error) {
    console.error('Error in loadUniversityData:', error);
    console.log('Falling back to mock data due to error');
    dataCache[normalizedName] = mockUniversityData;
    return mockUniversityData;
  }
};

// Extract all degrees from university data
export const getDegrees = (data: UniversityData | null): string[] => {
  if (!data?.programs) {
    console.log('No valid programs array in data, returning empty array');
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
