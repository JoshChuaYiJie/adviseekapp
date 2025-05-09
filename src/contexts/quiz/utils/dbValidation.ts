
import { supabase, type RpcParams } from '@/integrations/supabase/client';

// Check if a table exists in the database
export const checkTableExists = async (tableName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('check_table_exists', { 
        table_name: tableName 
      } as RpcParams);
      
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
      .rpc('check_column_exists', { 
        table_name: tableName,
        column_name: columnName 
      } as RpcParams);
      
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
      .rpc('check_table_rls', { 
        table_name: tableName 
      } as RpcParams);
      
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
