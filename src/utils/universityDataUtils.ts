
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

// Sample data structure to return when file isn't found
const defaultUniversityData: Record<string, UniversityData> = {
  nus: {
    programs: [
      {
        college: "School of Computing",
        major: "Computer Science",
        degree: "Bachelor of Computing",
        criteria: {
          eligibility: [
            {
              qualificationType: "A-Level",
              description: "Good grades in Mathematics and Computing/Physics"
            }
          ],
          suitability: [
            {
              criterion: "Analytical Thinking",
              description: "Strong problem-solving skills",
              weight: 0.8
            }
          ]
        }
      },
      {
        college: "School of Computing",
        major: "Information Systems",
        degree: "Bachelor of Computing",
        criteria: {
          eligibility: [
            {
              qualificationType: "A-Level",
              description: "Good grades in Mathematics"
            }
          ],
          suitability: [
            {
              criterion: "Technical Skills",
              description: "Understanding of business processes",
              weight: 0.7
            }
          ]
        }
      },
      {
        college: "Faculty of Arts and Social Sciences",
        major: "Economics",
        degree: "Bachelor of Arts",
        criteria: {
          eligibility: [
            {
              qualificationType: "A-Level",
              description: "Good grades in Mathematics"
            }
          ],
          suitability: [
            {
              criterion: "Analytical Thinking",
              description: "Interest in economic theories",
              weight: 0.75
            }
          ]
        }
      }
    ]
  },
  ntu: {
    programs: [
      {
        college: "School of Computer Science and Engineering",
        major: "Computer Science",
        degree: "Bachelor of Science",
        criteria: {
          eligibility: [
            {
              qualificationType: "A-Level",
              description: "Good grades in Mathematics and Computing/Physics"
            }
          ],
          suitability: [
            {
              criterion: "Technical Skills",
              description: "Programming experience",
              weight: 0.8
            }
          ]
        }
      },
      {
        college: "School of Electrical and Electronic Engineering",
        major: "Electrical Engineering",
        degree: "Bachelor of Engineering",
        criteria: {
          eligibility: [
            {
              qualificationType: "A-Level",
              description: "Good grades in Mathematics and Physics"
            }
          ],
          suitability: [
            {
              criterion: "Technical Skills",
              description: "Interest in circuits and systems",
              weight: 0.75
            }
          ]
        }
      }
    ]
  },
  smu: {
    programs: [
      {
        college: "School of Computing and Information Systems",
        major: "Information Systems",
        degree: "Bachelor of Science",
        criteria: {
          eligibility: [
            {
              qualificationType: "A-Level",
              description: "Good grades in Mathematics"
            }
          ],
          suitability: [
            {
              criterion: "Technical Skills",
              description: "Interest in business and technology",
              weight: 0.8
            }
          ]
        }
      },
      {
        college: "Lee Kong Chian School of Business",
        major: "Business Management",
        degree: "Bachelor of Business Management",
        criteria: {
          eligibility: [
            {
              qualificationType: "A-Level",
              description: "Good overall academic performance"
            }
          ],
          suitability: [
            {
              criterion: "Leadership",
              description: "Strong communication skills",
              weight: 0.7
            }
          ]
        }
      }
    ]
  }
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
        return { programs: [] };
    }
    
    // Attempt to load from file
    const filePath = `/school-data/Standardized weights/standardized_${shortName}_majors.json`;
    
    console.log(`Fetching university data from ${filePath} for ${university}`);
    
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        console.log(`File not found at ${filePath}, using default data`);
        // If file not found, use default data
        dataCache[normalizedName] = defaultUniversityData[shortName];
        return defaultUniversityData[shortName];
      }
      
      const data = await response.json();
      console.log(`Successfully loaded data for ${university}`, data);
      
      if (!data || !data.programs || !Array.isArray(data.programs)) {
        console.error(`Invalid data format for ${university}:`, data);
        // Return default data if file format is invalid
        dataCache[normalizedName] = defaultUniversityData[shortName];
        return defaultUniversityData[shortName];
      }
      
      dataCache[normalizedName] = data;
      return data;
    } catch (error) {
      console.error(`Error loading university data for ${university} from ${filePath}:`, error);
      
      // Return default data structure instead of empty one
      dataCache[normalizedName] = defaultUniversityData[shortName];
      return defaultUniversityData[shortName];
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
