"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Theme = keyof typeof themes;

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  getTheme: () => typeof themes[Theme];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themes = {
  palmirror: {
    userBg: "bg-blue-950/20",
    assistantBg: "bg-gray-900/10",
    bg: "",
    showUserName: false,
  },
  palmirrorSunset: {
    userBg: "bg-[#d88b5a]/20",
    assistantBg: "bg-[#d66e7b]/10",
    bg: "bg-[#6a2d10]",
    showUserName: false,
  },
  palmirrorOceans: {
    userBg: "bg-[#e16359]/20",
    assistantBg: "bg-[#006f73]/10",
    bg: "bg-[#1f3b4d]",
    showUserName: false,
  },
  cai: {
    userBg: "bg-[#303136]/50",
    assistantBg: "bg-[#26272b]/50",
    bg: "bg-[#18181b]",
    showUserName: true,
  },
};

export const PMThemeProvider = ({ children }: { children: ReactNode }) => {

  const [theme, setThemeState] = useState<Theme>('palmirror');

  const setTheme = (newTheme: Theme) => {
    if (themes.hasOwnProperty(newTheme)) {
      if (themes[newTheme]) {
        setThemeState(newTheme);
      } else {
        console.warn(`Theme ${newTheme} does not exist.`);
      }
    }
  };

  const getTheme = () => themes[theme];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, getTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};