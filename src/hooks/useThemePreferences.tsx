
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useThemePreferences = () => {
  const [theme, setThemeState] = useState(() => {
    // Get initial theme from localStorage as fallback
    return localStorage.getItem('theme') || 'auto';
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Apply theme to DOM
  const applyTheme = (newTheme: string) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (newTheme === 'auto') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
  };

  // Load user preferences from database
  const loadUserPreferences = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('theme')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      const userTheme = data?.theme || 'auto';
      setThemeState(userTheme);
      localStorage.setItem('theme', userTheme);
      applyTheme(userTheme);
    } catch (error) {
      console.error('Error loading theme preferences:', error);
      // Fallback to localStorage or default
      const fallbackTheme = localStorage.getItem('theme') || 'auto';
      setThemeState(fallbackTheme);
      applyTheme(fallbackTheme);
    } finally {
      setLoading(false);
    }
  };

  // Save theme preference to database
  const saveThemePreference = async (newTheme: string) => {
    if (!user) {
      // If not logged in, just save to localStorage
      localStorage.setItem('theme', newTheme);
      setThemeState(newTheme);
      applyTheme(newTheme);
      return;
    }

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          { user_id: user.id, theme: newTheme },
          { onConflict: 'user_id' }
        );

      if (error) throw error;

      localStorage.setItem('theme', newTheme);
      setThemeState(newTheme);
      applyTheme(newTheme);

      toast({
        title: "Theme Updated",
        description: `Theme changed to ${newTheme === 'auto' ? 'system default' : newTheme}.`,
      });
    } catch (error) {
      console.error('Error saving theme preference:', error);
      toast({
        title: "Error",
        description: "Failed to save theme preference. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load preferences when user changes or component mounts
  useEffect(() => {
    loadUserPreferences();
  }, [user]);

  // Apply theme when it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return {
    theme,
    setTheme: saveThemePreference,
    loading,
  };
};
