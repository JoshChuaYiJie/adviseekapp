
// Helper functions for comparing and matching various types of codes (RIASEC, Work Values)

// Helper function to check if two codes are permutations of each other
// Added null checks to prevent errors when dealing with null codes
export const arePermutations = (code1: string | null, code2: string | null): boolean => {
  // If either code is null or undefined, they are not permutations
  if (!code1 || !code2) return false;
  
  if (code1.length !== code2.length) return false;
  
  const sortedCode1 = [...code1].sort().join('');
  const sortedCode2 = [...code2].sort().join('');
  
  return sortedCode1 === sortedCode2;
};

// Helper function to check if short codes match with the beginning of longer codes
export const matchShortCode = (shortCode: string | null, longCode: string | null): boolean => {
  // If either code is null or undefined, they don't match
  if (!shortCode || !longCode) return false;
  
  // If short code is longer than long code, they can't match
  if (shortCode.length > longCode.length) return false;
  
  // For 1 or 2 letter codes, check if each character in shortCode exists in the first N characters of longCode
  // where N is the length of shortCode
  for (let i = 0; i < shortCode.length; i++) {
    // Check if the character exists in the first N characters of longCode
    if (!longCode.substring(0, shortCode.length).includes(shortCode[i])) {
      return false;
    }
  }
  
  return true;
};
