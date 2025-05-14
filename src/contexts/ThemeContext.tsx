
import React, { createContext, useState, useContext, useEffect } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isCurrentlyDark: boolean;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

// The ThemeProvider component must be a function component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get initial theme from localStorage or default to system
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem("theme");
      return (savedTheme as Theme) || "system";
    }
    return "system";
  });
  
  const [isCurrentlyDark, setIsCurrentlyDark] = useState<boolean>(false);
  
  // Function to update the theme
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem("theme", newTheme);
    }
  };

  // Effect to apply theme classes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
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
    if (typeof window === 'undefined' || theme !== "system") return;
    
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
