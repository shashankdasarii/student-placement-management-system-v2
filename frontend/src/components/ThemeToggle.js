import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { playSwitch } from '../utils/soundEngine';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      playSwitch();
    } catch (err) {
      // AudioContext fallback
    }
    toggleTheme();
  };

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`btn btn-secondary btn-sm theme-toggle-pill ${className}`}
      onClick={handleToggle}
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      aria-label="Toggle theme"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: 700,
        padding: '6px 14px',
        cursor: 'pointer'
      }}
    >
      <span style={{ fontSize: '13px' }}>{isDark ? '☀️' : '🌙'}</span>
      <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {isDark ? 'Light' : 'Dark'}
      </span>
    </button>
  );
};

export default ThemeToggle;
