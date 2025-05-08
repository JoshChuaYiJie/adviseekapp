
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Module } from '@/integrations/supabase/client';

export const useModules = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter modules based on various criteria
  const filterModules = (options: {
    universityFilter?: string;
    searchTerm?: string;
  }) => {
    const { universityFilter, searchTerm } = options;
    
    return modules.filter(module => {
      // Apply university filter
      if (universityFilter && module.university !== universityFilter) {
        return false;
      }
      
      // Apply search term filter
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        const titleMatch = module.title?.toLowerCase().includes(searchTermLower);
        const codeMatch = module.course_code?.toLowerCase().includes(searchTermLower);
        const descriptionMatch = module.description?.toLowerCase().includes(searchTermLower);
        
        if (!titleMatch && !codeMatch && !descriptionMatch) {
          return false;
        }
      }
      
      return true;
    });
  };

  // Load all modules from database
  const loadModules = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use raw SQL query instead of ORM since modules isn't in the types
      const { data, error } = await supabase
        .rpc('get_all_modules');
      
      if (error) {
        throw new Error(`Error fetching modules: ${error.message}`);
      }
      
      // Use type assertion to ensure data fits the Module type
      setModules(data as unknown as Module[]);
    } catch (err) {
      console.error('Error in loadModules:', err);
      setError(err instanceof Error ? err.message : 'Failed to load modules');
    } finally {
      setIsLoading(false);
    }
  };

  // Get a single module by ID
  const getModuleById = async (moduleId: number): Promise<Module | null> => {
    try {
      // Use raw SQL query
      const { data, error } = await supabase
        .rpc('get_module_by_id', { module_id: moduleId });
      
      if (error) {
        throw error;
      }
      
      return data.length > 0 ? (data[0] as unknown as Module) : null;
    } catch (err) {
      console.error(`Error fetching module with ID ${moduleId}:`, err);
      return null;
    }
  };

  // Get multiple modules by their IDs
  const getModulesByIds = async (moduleIds: number[]): Promise<Module[]> => {
    if (moduleIds.length === 0) return [];
    
    try {
      // Use raw SQL query
      const { data, error } = await supabase
        .rpc('get_modules_by_ids', { module_ids: moduleIds });
      
      if (error) {
        throw error;
      }
      
      return data as unknown as Module[];
    } catch (err) {
      console.error('Error fetching modules by IDs:', err);
      return [];
    }
  };

  return {
    modules,
    isLoading,
    error,
    loadModules,
    filterModules,
    getModuleById,
    getModulesByIds
  };
};
