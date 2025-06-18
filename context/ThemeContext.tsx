import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

// Theme Context
type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');

  // Determine if we're in dark mode based on theme setting and system preference
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && systemColorScheme === 'dark');

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Scan Context
interface Scorecard {
  [key: string]: any;
}

interface ScanContextType {
  upc: string | null;
  scorecard: Scorecard | null;
  setResult: ({ upc, scorecard }: { upc: string | null; scorecard: Scorecard | null }) => void;
}

const ScanContext = createContext<ScanContextType | undefined>(undefined);

interface ScanProviderProps {
  children: ReactNode;
}

export const ScanProvider: React.FC<ScanProviderProps> = ({ children }) => {
  const [upc, setUpc] = useState<string | null>(null);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);

  const setResult = ({ upc, scorecard }: { upc: string | null; scorecard: Scorecard | null }) => {
    setUpc(upc);
    setScorecard(scorecard);
  };

  return (
    <ScanContext.Provider value={{ upc, scorecard, setResult }}>
      {children}
    </ScanContext.Provider>
  );
};

export const useScan = () => {
  const context = useContext(ScanContext);
  if (context === undefined) {
    throw new Error('useScan must be used within a ScanProvider');
  }
  return context;
};