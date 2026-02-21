import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useUser } from '@/contexts/UserContext';

export type ThemeMode = 'light' | 'dark' | 'pastel' | 'comfort' | 'sunset';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { currentUser, settings, updateSettings } = useUser();
  const theme = (currentUser && settings?.theme ? settings.theme : 'light') as ThemeMode;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-pastel', 'theme-comfort', 'theme-sunset');
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  const setTheme = (t: ThemeMode) => {
    if (currentUser) {
      updateSettings({ theme: t });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
