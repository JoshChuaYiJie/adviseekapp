
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface ProfileInfoProps {
  riasecCode: string;
  workValueCode: string;
  isLoading: boolean;
}

interface ProfileDetails {
  strengths: string[];
  workPreferences: string[];
  likes: string[];
  dislikes: string[];
}

export const ProfileInfo = ({ riasecCode, workValueCode, isLoading }: ProfileInfoProps) => {
  const { isCurrentlyDark } = useTheme();
  const [profileInfo, setProfileInfo] = useState<ProfileDetails>({
    strengths: [],
    workPreferences: [],
    likes: [],
    dislikes: []
  });
  
  useEffect(() => {
    // Generate dynamic profile information based on RIASEC and Work Values
    const dynamicStrengths = generateStrengthsFromRIASEC(riasecCode);
    const dynamicWorkPreferences = generateWorkPreferencesFromWorkValues(workValueCode);
    const dynamicLikes = generateLikesFromRIASEC(riasecCode);
    const dynamicDislikes = generateDislikesFromRIASEC(riasecCode);
    
    setProfileInfo({
      strengths: dynamicStrengths,
      workPreferences: dynamicWorkPreferences,
      likes: dynamicLikes,
      dislikes: dynamicDislikes
    });
  }, [riasecCode, workValueCode]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Personality traits</h3>
        <ul className="list-disc pl-5 space-y-1">
          {profileInfo.strengths.map((strength, index) => <li key={`strength-${index}`}>{strength}</li>)}
        </ul>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Work Environment Preferences</h3>
        <ul className="list-disc pl-5 space-y-1">
          {profileInfo.workPreferences.map((preference, index) => <li key={`pref-${index}`}>{preference}</li>)}
        </ul>
      </div>
      
      {/* Likes section */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Likes</h3>
        <ul className="list-disc pl-5 space-y-1">
          {profileInfo.likes.map((like, index) => <li key={`like-${index}`}>{like}</li>)}
        </ul>
      </div>
      
      {/* Dislikes section */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Dislikes</h3>
        <ul className="list-disc pl-5 space-y-1">
          {profileInfo.dislikes.map((dislike, index) => <li key={`dislike-${index}`}>{dislike}</li>)}
        </ul>
      </div>
    </div>
  );
};

// Helper functions for generating profile information
const generateStrengthsFromRIASEC = (code: string): string[] => {
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

// Function to generate likes based on RIASEC code
const generateLikesFromRIASEC = (code: string): string[] => {
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

// Function to generate dislikes based on RIASEC code
const generateDislikesFromRIASEC = (code: string): string[] => {
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

const generateWorkPreferencesFromWorkValues = (code: string): string[] => {
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
