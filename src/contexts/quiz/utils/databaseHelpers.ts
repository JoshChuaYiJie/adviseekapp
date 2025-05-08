
import { supabase } from "@/integrations/supabase/client";
import type { TableName } from "@/integrations/supabase/client";

// Helper function to get supabase table reference with proper typing
export const fromTable = (tableName: string) => {
  return supabase.from(tableName);
};

// Get current user ID helper
export const getUserId = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch (error) {
    console.error("Error getting user ID:", error);
    return null;
  }
};
