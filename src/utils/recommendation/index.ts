
import majorRecommendations from './majorRecommendations';

// Mapping functions for RIASEC and Work Values codes
export const mapRiasecToCode = (component: string) => {
  return component.charAt(0).toUpperCase();
};

export const mapWorkValueToCode = (component: string) => {
  switch (component) {
    case 'Achievement':
      return 'A';
    case 'Relationships':
      return 'R';
    case 'Independence':
      return 'I';
    case 'Recognition':
      return 'Rc';
    case 'Working Conditions':
      return 'W';
    case 'WorkingConditions':
      return 'W';
    case 'Support':
      return 'S';
    default:
      return '';
  }
};

// Generate a code from profile data
export const formCode = (data: Array<{component: string, average: number, score: number}>, mapFunction: (component: string) => string) => {
  if (!data || data.length === 0) {
    return '';
  }
  
  // Sort by score in descending order
  const sortedComponents = [...data].sort((a, b) => b.score - a.score);
  
  // Take top 3 components
  const topComponents = sortedComponents.slice(0, 3);
  
  // Map components to code letters
  const codeArray = topComponents.map(item => mapFunction(item.component)).filter(Boolean);
  
  return codeArray.join('');
};

// Function to generate strengths from RIASEC code
export const generateStrengthsFromRIASEC = (code: string): string[] => {
  const traits: Record<string, string[]> = {
    'R': ['Independent and Reliable', 'Practical and Physically Adept', 'Straightforward and Persistent'],
    'I': ['Curious and Analytical', 'Logical and Observant', 'Introspective', 'Critical thinker'],
    'A': ['Imaginative and Expressive', 'Intuitive and Original', 'Emotional and Open-minded', 'Open-minded'],
    'S': ['Empathetic and Friendly', 'Nurturing and Patient', 'Supportive and Cooperative'],
    'E': ['Charismatic and Ambitious', 'Optimistic and Energetic', 'Assertive and Goal-oriented'],
    'C': ['Organized and Methodical', 'Detail-oriented and Conscientious', 'Disciplined']
  };

  // Get the top 2-3 letters from the code
  const topLetters = code.slice(0, Math.min(3, code.length));
  
  // Collect traits for each letter in the code
  const result: string[] = [];
  for (const letter of topLetters) {
    if (traits[letter]) {
      // Add 2 random traits from each letter category
      const categoryTraits = traits[letter];
      const selectedTraits: string[] = [];
      const indices = [...Array(categoryTraits.length).keys()]; // Array of indices [0, 1, 2, ...]
      for (let i = 0; i < Math.min(2, categoryTraits.length); i++) {
        if (indices.length === 0) break; // Avoid errors if fewer than 2 traits
        const randomIndex = Math.floor(Math.random() * indices.length);
        const traitIndex = indices.splice(randomIndex, 1)[0]; // Remove and get random index
        selectedTraits.push(categoryTraits[traitIndex]);
      }
      result.push(...selectedTraits);
    }
  }
  return result.slice(0, 6); // Limit to 6 traits total
};
  
// Function to generate likes from RIASEC code
export const generateLikesFromRIASEC = (code: string): string[] => {
  const likes: Record<string, string[]> = {
    'R': ['Working with tools, machines, or materials', 'Building or fixing things', 'Outdoor activities', 'Tasks with clear, tangible outcomes'],
    'I': ['Researching', 'Experimenting', 'Analyzing data', 'Solving complex problems', 'Learning new concepts'],
    'A': ['Creating art, writing, music, or designs', 'Experimenting with aesthetics', 'Expressing individuality'],
    'S': ['Helping, teaching, or counseling others', 'Collaborating in teams', 'Building relationships', 'Making a positive impact'],
    'E': ['Leading teams', 'Persuading others', 'Negotiating', 'Starting businesses', 'Taking risks'],
    'C': ['Managing data', 'Creating schedules', 'Maintaining records', 'Following clear procedures', 'Structured environments']
  };

  // Get top 3 letters from the code
  const topLetters = code.slice(0, Math.min(3, code.length));
  
  // Collect likes for each letter
  const result: string[] = [];
  for (const letter of topLetters) {
    if (likes[letter]) {
      // Add 1-2 likes from each category
      const categoryLikes = likes[letter];
      const randomIndex = Math.floor(Math.random() * categoryLikes.length);
      result.push(categoryLikes[randomIndex]);
      
      // Add a second like if available
      if (categoryLikes.length > 1) {
        let secondIndex = (randomIndex + 1) % categoryLikes.length;
        result.push(categoryLikes[secondIndex]);
      }
    }
  }
  
  return result.slice(0, 4); // Limit to 4 total likes
};
  
// Function to generate dislikes from RIASEC code
export const generateDislikesFromRIASEC = (code: string): string[] => {
  const dislikes: Record<string, string[]> = {
    'R': ['Abstract theorizing', 'Ambiguous tasks', 'Highly social or desk-bound work'],
    'I': ['Routine tasks', 'Overly social environments', 'Lack of intellectual challenge'],
    'A': ['Rigid structures', 'Repetitive tasks', 'Conforming to strict rules'],
    'S': ['Isolated work', 'Competitive environments', 'Tasks without human connection'],
    'E': ['Lack of control', 'Mundane tasks', 'Environments without opportunities for advancement'],
    'C': ['Chaos', 'Ambiguity', 'Highly creative or unpredictable tasks']
  };

  // Get top 3 letters from the code
  const topLetters = code.slice(0, Math.min(3, code.length));
  
  // Collect dislikes for each letter
  const result: string[] = [];
  for (const letter of topLetters) {
    if (dislikes[letter]) {
      // Add 1 dislike from each category
      const categoryDislikes = dislikes[letter];
      const randomDislike = categoryDislikes[Math.floor(Math.random() * categoryDislikes.length)];
      result.push(randomDislike);
    }
  }
  
  return result.slice(0, 3); // Limit to 3 total dislikes
};

// Function to generate work preferences from Work Values code
export const generateWorkPreferencesFromWorkValues = (code: string): string[] => {
  const preferences: Record<string, string[]> = {
    'A': [
      'Challenging Tasks and Clear Measurable Goals',
      'Opportunities for Advancement and Regular Performance Feedback',
      'Culture Rewarding Excellence'
    ],
    'R': [
      'Collaborative Team-Oriented Settings and Supportive Inclusive Culture',
      'Trust and Mutual Respect and Frequent Colleague Interaction'
    ],
    'I': [
      'Autonomous and Flexible Roles and Minimal Supervision',
      'Independent Decision-Making and Creative Approaches to Tasks'
    ],
    'Rc': [
      'Public Acknowledgment of Contributions and Clear Promotion Pathways',
      'Recognition through Awards and Career Advancement Opportunities'
    ],
    'W': [
      'Safe Well-Equipped Workplace and Fair Compensation',
      'Reasonable Hours and Job Security',
      'Work-Life Balance'
    ],
    'S': [
      'Supportive Leadership and Clear Guidance',
      'Mentorship Opportunities and Accessible Resources',
      'Encouraging Atmosphere'
    ]
  };

  const result: string[] = [];
  const upperCode = code.toUpperCase();
  const uniqueLetters = [...new Set(upperCode.split(''))];

  // Step 1: If 4-letter code with both R and C, include Rc first
  if (upperCode.length === 4 && uniqueLetters.includes('R') && uniqueLetters.includes('C')) {
    result.push(...preferences['Rc'].slice(0, 2));
  }

  // Step 2: Go through the top 3 letters in the original code (in order) and pull prefs
  for (const letter of upperCode.slice(0, 3)) {
    const key = letter;
    if (preferences[key]) {
      for (const pref of preferences[key]) {
        if (result.length >= 4) break;
        if (!result.includes(pref)) {
          result.push(pref);
        }
      }
    }
    if (result.length >= 4) break;
  }

  return result.slice(0, 4); // Return up to 4 preferences
};

// Get matching majors based on user's RIASEC and Work Values codes
export const getMatchingMajors = async (riasecCode: string, workValueCode: string) => {
  try {
    console.log(`Finding matching majors for RIASEC: ${riasecCode}, Work Values: ${workValueCode}`);
    
    // All matches
    const exactMatches: string[] = [];
    const permutationMatches: string[] = [];
    const riasecMatches: string[] = [];
    const workValueMatches: string[] = [];
    
    // Create permutations of the RIASEC code (e.g., "RIA", "RAI", "IRA", "IAR", "ARI", "AIR")
    const createPermutations = (code: string): string[] => {
      const chars = code.split('');
      const result: string[] = [];
      
      const permute = (arr: string[], m: string[] = []) => {
        if (arr.length === 0) {
          result.push(m.join(''));
          return;
        }
        
        for (let i = 0; i < arr.length; i++) {
          const curr = arr.slice();
          const next = curr.splice(i, 1);
          permute(curr, m.concat(next));
        }
      }
      
      permute(chars);
      return result;
    };
    
    const riasecPermutations = createPermutations(riasecCode);
    console.log('Generated RIASEC permutations:', riasecPermutations);
    
    // Check for matches in the majorRecommendations
    majorRecommendations.forEach(major => {
      // Check for exact matches (both RIASEC and Work Values)
      if (major.riasec === riasecCode && major.workValue === workValueCode) {
        exactMatches.push(major.name);
      }
      // Check for RIASEC permutations with same Work Values
      else if (riasecPermutations.includes(major.riasec) && major.workValue === workValueCode) {
        permutationMatches.push(major.name);
      }
      // Check for RIASEC matches only
      else if (riasecPermutations.includes(major.riasec)) {
        riasecMatches.push(major.name);
      }
      // Check for Work Values matches only
      else if (major.workValue === workValueCode) {
        workValueMatches.push(major.name);
      }
    });
    
    // Determine the best match type
    let matchType = 'none';
    if (exactMatches.length > 0) {
      matchType = 'exact';
    } else if (permutationMatches.length > 0) {
      matchType = 'permutation';
    } else if (riasecMatches.length > 0 || workValueMatches.length > 0) {
      matchType = 'partial';
    }
    
    console.log(`Found matches - Exact: ${exactMatches.length}, Permutation: ${permutationMatches.length}, RIASEC: ${riasecMatches.length}, Work Value: ${workValueMatches.length}`);
    
    return {
      exactMatches,
      permutationMatches,
      riasecMatches,
      workValueMatches,
      matchType
    };
  } catch (error) {
    console.error('Error getting matching majors:', error);
    return {
      exactMatches: [],
      permutationMatches: [],
      riasecMatches: [],
      workValueMatches: [],
      matchType: 'error'
    };
  }
};

export default majorRecommendations;
