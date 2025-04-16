
import { supabase, TableName } from '@/integrations/supabase/client';

// Helper function to work with Supabase tables with proper typing
export const fromTable = (table: TableName) => {
  return supabase.from(table);
};

// Get current user ID or null if not logged in
export const getUserId = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id || null;
};
