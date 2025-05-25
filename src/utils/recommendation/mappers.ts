
// Function to map RIASEC components to their codes
export const mapRiasecToCode = (component: string): string => {
  switch (component) {
    case 'R': return 'R';
    case 'I': return 'I';
    case 'A': return 'A';
    case 'S': return 'S';
    case 'E': return 'E';
    case 'C': return 'C';
    case 'Realistic': return 'R';
    case 'Investigative': return 'I';
    case 'Artistic': return 'A';
    case 'Social': return 'S';
    case 'Enterprising': return 'E';
    case 'Conventional': return 'C';
    default: return '';
  }
};

// Function to map Work Value components to their codes
export const mapWorkValueToCode = (component: string): string => {
  switch (component) {
    case 'A': return 'A';
    case 'R': return 'R';
    case 'I': return 'I';
    case 'Rc': return 'Rc';
    case 'W': return 'W';
    case 'S': return 'S';
    case 'Al': return 'Al';
    case 'Achievement': return 'A';
    case 'Relationships': return 'R';
    case 'Independence': return 'I';
    case 'Recognition': return 'Rc';
    case 'Working Conditions': return 'W';
    case 'Support': return 'S';
    case 'Altruism': return 'Al';
    default: return '';
  }
};

// Function to form a code from component list - respects the order provided (already sorted by score)
export const formCode = (
  components: Array<{ component: string; average: number; score: number }>, 
  mapper: (component: string) => string
): string => {
  // We use the components array which is already sorted by score in descending order
  // Important: Log the input components to debug the order
  
  
  // Take top 3 and map them to their codes
  const code = components
    .slice(0, 3) // Take top 3 highest scoring components
    .map(item => {
      const mappedCode = mapper(item.component);
      
      return mappedCode;
    })
    .join('');
    
  
  return code;
};
