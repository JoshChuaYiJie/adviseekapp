
import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type Theme = "light" | "dark" | "system";

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isCurrentlyDark: boolean;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Get initial theme from localStorage or default to system
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme as Theme) || "system";
  });
  
  const [isCurrentlyDark, setIsCurrentlyDark] = useState<boolean>(false);
  const [userLoaded, setUserLoaded] = useState(false);
  
  // Function to update the theme
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // Load user theme preference from Supabase
  const loadUserTheme = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('theme')
        .eq('id', userId)
        .single();

      if (data && data.theme && !error) {
        const userTheme = data.theme as Theme;
        setThemeState(userTheme);
        localStorage.setItem("theme", userTheme);
      }
    } catch (error) {
      console.error('Error loading user theme:', error);
    }
  };

  // Listen for auth changes and load user theme
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user && !userLoaded) {
          await loadUserTheme(session.user.id);
          setUserLoaded(true);
        } else if (!session?.user) {
          setUserLoaded(false);
          // Reset to system theme when user logs out
          const systemTheme = localStorage.getItem("theme") || "system";
          setThemeState(systemTheme as Theme);
        }
      }
    );

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !userLoaded) {
        loadUserTheme(session.user.id);
        setUserLoaded(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [userLoaded]);

  // Effect to apply theme classes
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      setIsCurrentlyDark(systemTheme === "dark");
    } else {
      root.classList.add(theme);
      setIsCurrentlyDark(theme === "dark");
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        setIsCurrentlyDark(mediaQuery.matches);
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(mediaQuery.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isCurrentlyDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
