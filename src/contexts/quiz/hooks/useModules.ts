
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Module } from '@/integrations/supabase/client';

export const useModules = (university?: string) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch modules from local JSON file
        let data: Module[] = [];
        
        try {
          const response = await fetch('/data/modules.json');
          if (response.ok) {
            data = await response.json();
            console.log('Successfully loaded modules data:', data.length, 'modules');
          } else {
            throw new Error('Failed to load modules data');
          }
        } catch (fileError) {
          console.error('Modules data file load error:', fileError);
          data = [];
        }
        
        // Filter by university if specified
        if (university) {
          data = data.filter(mod => mod.university === university);
        }
        
        // Update state with the modules
        setModules(data || []);
        
      } catch (err) {
        console.error('Error fetching modules:', err);
        setError(err instanceof Error ? err.message : 'Failed to load modules');
      } finally {
        setIsLoading(false);
      }
    };

    fetchModules();
  }, [university]);

  // Fetch modules by ID
  const fetchModuleById = async (moduleId: number): Promise<Module | null> => {
    try {
      // Try to find the module in our existing modules
      const existingModule = modules.find(m => m.id === moduleId);
      if (existingModule) return existingModule;
      
      // Otherwise fetch from the same local source
      try {
        const response = await fetch('/data/modules.json');
        if (response.ok) {
          const allModules = await response.json();
          return allModules.find((m: Module) => m.id === moduleId) || null;
        }
      } catch (error) {
        console.error("Error fetching module by ID:", error);
      }
      
      return null;
    } catch (err) {
      console.error('Error fetching module by ID:', err);
      return null;
    }
  };

  return {
    modules,
    isLoading,
    error,
    fetchModuleById
  };
};
