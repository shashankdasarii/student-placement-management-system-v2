import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('apex_theme') || localStorage.getItem('neu_theme') || 'light';
    } catch (e) {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      // Set attribute and class on both <html> and <body>
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);

      if (document.body) {
        document.body.setAttribute('data-theme', theme);
        document.body.classList.remove('light', 'dark');
        document.body.classList.add(theme);
      }

      localStorage.setItem('apex_theme', theme);
      localStorage.setItem('neu_theme', theme);
    } catch (e) {
      console.warn('Theme storage error:', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
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

export default ThemeContext;
