
import { Module } from '@/integrations/supabase/client';

export interface Recommendation {
  id: number;
  user_id: string;
  module_id: number;
  reason: string;
  created_at: string;
  module: Module;
  reasoning?: string[];
}

export interface ModuleSelection {
  module: Module;
  reason: string;
}
