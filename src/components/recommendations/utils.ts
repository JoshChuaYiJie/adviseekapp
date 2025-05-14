
/**
 * Generate consistent module IDs from course codes
 * @param code The course code to generate an ID for
 * @returns A numeric ID based on the code
 */
export function getModuleId(code: string): number {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    const char = code.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
