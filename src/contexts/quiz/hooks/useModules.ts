import { useState } from 'react';
import { Module } from '@/integrations/supabase/client';
import { fromTable } from '../utils/databaseHelpers';

export const useModules = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Load modules from database or JSON files
  const loadModules = async () => {
    try {
      // First check if modules already exist in database
      const { data: existingModules, error: checkError } = await fromTable('modules')
        .select('id')
        .limit(1);
      
      if (checkError) {
        throw new Error(`Failed to check modules: ${checkError.message}`);
      }
      
      // If modules exist, just load them
      if (existingModules && existingModules.length > 0) {
        const { data, error } = await fromTable('modules')
          .select();
          
        if (error) {
          throw new Error(`Failed to load modules: ${error.message}`);
        }
        
        setModules(data as Module[] || []);
        return;
      }
      
      // Otherwise load from JSON files and insert into database
      const [smuData] = await Promise.all([
        fetch('/school-data/SMU MODs AY 2024-2025 Term2.json').then(res => res.json())
      ]);
      
      // Parse SMU data
      const smuModules = smuData.map((mod: any, index: number) => {
        // Extract course code and title
        const courseCode = mod.textsm.split(' | ')[0];
        const title = mod.Title;
        
        // Extract AU/CU
        const auMatch = mod.textsm.match(/(\d+) CU/);
        const aus_cus = auMatch ? parseInt(auMatch[1]) : 1;
        
        // Extract semester/term
        const semester = "Term 2";
        
        return {
          id: index + 1,
          university: "SMU" as const,
          course_code: courseCode,
          title: title,
          aus_cus: aus_cus,
          semester: semester,
          description: `This course covers topics relevant to ${title}.`
        };
      });
      
      // Insert modules into database
      const { error: insertError } = await fromTable('modules')
        .insert(smuModules);
      
      if (insertError) {
        throw new Error(`Failed to save modules: ${insertError.message}`);
      }
      
      // Load the saved modules
      const { data: savedModules, error: loadError } = await fromTable('modules')
        .select();
        
      if (loadError) {
        throw new Error(`Failed to load saved modules: ${loadError.message}`);
      }
      
      setModules(savedModules as Module[] || []);
    } catch (err) {
      console.error("Error loading modules:", err);
      setError(err instanceof Error ? err.message : "Failed to load modules");
    }
  };
  
  return { modules, loadModules, error };
};
