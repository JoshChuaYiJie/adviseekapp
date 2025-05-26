
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UserSettings {
  theme: string;
  email_notifications: boolean;
  deadline_reminders: boolean;
}

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings>({
    theme: "dark",
    email_notifications: true,
    deadline_reminders: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load user settings on mount
  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user settings:', error);
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        });
      } else if (data) {
        setSettings({
          theme: data.theme || "dark",
          email_notifications: data.email_notifications ?? true,
          deadline_reminders: data.deadline_reminders ?? true,
        });
      } else {
        // No settings found, create default settings
        await createDefaultSettings(user.id);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultSettings = async (userId: string) => {
    try {
      const defaultSettings = {
        id: userId,
        theme: "dark",
        email_notifications: true,
        deadline_reminders: true,
      };

      const { error } = await supabase
        .from('user_settings')
        .insert(defaultSettings);

      if (error) {
        console.error('Error creating default settings:', error);
      } else {
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error creating default settings:', error);
    }
  };

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to update settings",
          variant: "destructive",
        });
        return;
      }

      const updatedSettings = { ...settings, [key]: value };
      setSettings(updatedSettings);

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          id: user.id,
          [key]: value,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating setting:', error);
        // Revert the change if there was an error
        setSettings(settings);
        toast({
          title: "Error",
          description: "Failed to update setting",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      // Revert the change if there was an error
      setSettings(settings);
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    }
  };

  return {
    settings,
    updateSetting,
    isLoading,
  };
};
