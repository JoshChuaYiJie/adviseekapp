
import { supabase } from '@/integrations/supabase/client';

// Define RPC parameter types
type CheckTableExistsParams = { table_name: string };
type CheckColumnExistsParams = { table_name: string; column_name: string };
type CheckTableRlsParams = { table_name: string };

// Check if a table exists in the database
export const checkTableExists = async (tableName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('check_rls_enabled', { 
        table_name: tableName 
      });
      
    if (error) {
      console.error(`Error checking if table ${tableName} exists:`, error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error(`Exception checking if table ${tableName} exists:`, error);
    return false;
  }
};

// Check if a column exists in a table
export const checkColumnExists = async (tableName: string, columnName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('check_unique_constraint', { 
        table_name: tableName,
        column_names: [columnName]
      });
      
    if (error) {
      console.error(`Error checking if column ${columnName} exists in ${tableName}:`, error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error(`Exception checking if column ${columnName} exists in ${tableName}:`, error);
    return false;
  }
};

// Check if a table has Row Level Security enabled
export const checkRlsEnabled = async (tableName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('check_rls_enabled', { 
        table_name: tableName 
      });
      
    if (error) {
      console.error(`Error checking RLS for table ${tableName}:`, error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error(`Exception checking RLS for table ${tableName}:`, error);
    return false;
  }
};

export default {
  checkTableExists,
  checkColumnExists,
  checkRlsEnabled
};
