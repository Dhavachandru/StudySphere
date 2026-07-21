import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';

type Theme = 'dark' | 'light';

type ThemeState = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeState | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('ss-theme') as Theme | null;
    return saved ?? 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('ss-theme', theme);
  }, [theme]);

  // Load theme from settings when user logs in
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('settings').select('theme').eq('user_id', user.id).maybeSingle();
      if (data?.theme === 'light' || data?.theme === 'dark') setThemeState(data.theme);
    })();
  }, [user]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    if (user) supabase.from('settings').upsert({ user_id: user.id, theme: t }, { onConflict: 'user_id' }).then(() => {});
  };

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
