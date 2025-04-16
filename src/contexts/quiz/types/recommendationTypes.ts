
import { Module } from '@/integrations/supabase/client';

export interface Recommendation {
  module_id: number;
  reason: string;
  module?: Module;
}

export interface FeedbackItem {
  module_id: number;
  rating: number;
}

export interface ModuleSelection {
  module: Module;
  reason: string;
}
