
import { Module } from '@/integrations/supabase/client';

export type RecommendedModule = {
  module: Module;
  reasoning: string[];
  rating?: number;
};

export type UserFeedbackItem = {
  id: number;
  user_id: string;
  module_id: number;
  rating: number;
  created_at: string;
};

export type ModuleSelection = Module;
