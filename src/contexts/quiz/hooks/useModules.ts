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

        // Try to fetch from Supabase Edge Function first
        let data: Module[] = [];
        let usingFallback = false;
        
        try {
          console.log('Attempting to fetch modules from Supabase edge function');
          const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('get_all_modules');
          
          if (edgeFunctionError) {
            console.error('Edge function error:', edgeFunctionError);
            throw edgeFunctionError;
          }
          
          if (edgeFunctionData && Array.isArray(edgeFunctionData)) {
            data = edgeFunctionData;
            console.log('Successfully loaded modules from edge function:', data.length, 'modules');
          } else {
            console.warn('Edge function returned invalid data format, falling back to local JSON');
            throw new Error('Invalid data format from edge function');
          }
        } catch (edgeError) {
          console.warn('Error fetching from edge function, falling back to local JSON:', edgeError);
          usingFallback = true;
          
          // Fallback: Fetch modules from local JSON file
          try {
            const response = await fetch('/data/modules.json');
            if (response.ok) {
              data = await response.json();
              console.log('Successfully loaded modules data from local file:', data.length, 'modules');
            } else {
              throw new Error('Failed to load modules data from local file');
            }
          } catch (fileError) {
            console.error('Modules data file load error:', fileError);
            data = [];
          }
        }
        
        // Filter by university if specified
        if (university && data.length > 0) {
          data = data.filter(mod => mod.university === university);
          console.log(`Filtered to ${data.length} modules for university: ${university}`);
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
      
      // Try edge function first
      try {
        const { data, error } = await supabase.functions.invoke('get_module_by_id', {
          body: { id: moduleId }
        });
        
        if (error) throw error;
        if (data) return data as Module;
      } catch (edgeError) {
        console.warn('Edge function error, falling back to local file:', edgeError);
        
        // Otherwise fetch from local source
        try {
          const response = await fetch('/data/modules.json');
          if (response.ok) {
            const allModules = await response.json();
            return allModules.find((m: Module) => m.id === moduleId) || null;
          }
        } catch (error) {
          console.error("Error fetching module by ID:", error);
        }
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
