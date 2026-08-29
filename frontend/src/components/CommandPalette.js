import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { playClick, playSwitch, isSoundEnabled, setSoundEnabled } from '../utils/soundEngine';

const CommandPalette = ({ eligibleJobs = [], onSelectJob = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => {
          if (!prev) playSwitch();
          return !prev;
        });
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Base system actions
  const defaultActions = useMemo(() => {
    const actions = [
      {
        id: 'toggle-theme',
        title: `Switch Theme to ${theme === 'light' ? 'Dark Obsidian' : 'Light Alloy'}`,
        category: 'System Appearance',
        icon: theme === 'light' ? '🌙' : '☀️',
        run: () => {
          toggleTheme();
          playSwitch();
        }
      },
      {
        id: 'toggle-sound',
        title: `Toggle Audio Haptics (${isSoundEnabled() ? 'Currently Active' : 'Currently Muted'})`,
        category: 'Sensory Haptics',
        icon: isSoundEnabled() ? '🔊' : '🔇',
        run: () => {
          setSoundEnabled(!isSoundEnabled());
          playSwitch();
        }
      }
    ];

    if (user?.role === 'student') {
      if (user?.resume_url) {
        actions.push({
          id: 'view-resume',
          title: 'Inspect Verified PDF Resume Documentation',
          category: 'Candidate Dossier',
          icon: '📄',
          run: () => {
            playClick();
            window.open(user.resume_url, '_blank');
          }
        });
      }
      actions.push({
        id: 'student-portal',
        title: 'Navigate to Student Dashboard',
        category: 'Navigation',
        icon: '🎓',
        run: () => {
          playClick();
          navigate('/student-dashboard');
        }
      });
    }

    if (user?.role === 'recruiter') {
      actions.push({
        id: 'recruiter-portal',
        title: 'Navigate to Recruiter Management Console',
        category: 'Navigation',
        icon: '💼',
        run: () => {
          playClick();
          navigate('/recruiter-dashboard');
        }
      });
    }

    if (user) {
      actions.push({
        id: 'logout',
        title: 'Sign Out of Placement System',
        category: 'Authentication',
        icon: '🚪',
        run: () => {
          playClick();
          logout();
          navigate('/login');
        }
      });
    }

    // Add search hits from eligible jobs if student
    if (eligibleJobs.length > 0) {
      eligibleJobs.forEach((job) => {
        actions.push({
          id: `job-${job.id}`,
          title: `${job.title} at ${job.company_name}`,
          subtitle: `Min CGPA: ${parseFloat(job.min_cgpa).toFixed(2)} • Deadline: ${new Date(job.deadline).toLocaleDateString()}`,
          category: 'Placement Drives',
          icon: '💼',
          run: () => {
            playClick();
            if (onSelectJob) onSelectJob(job);
          }
        });
      });
    }

    return actions;
  }, [theme, user, eligibleJobs, toggleTheme, logout, navigate, onSelectJob]);

  // Filter actions by query
  const filteredActions = useMemo(() => {
    if (!query.trim()) return defaultActions;
    const q = query.toLowerCase();
    return defaultActions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.subtitle && a.subtitle.toLowerCase().includes(q)) ||
        a.category.toLowerCase().includes(q)
    );
  }, [defaultActions, query]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredActions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % Math.max(1, filteredActions.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const action = filteredActions[selectedIndex];
      if (action) {
        action.run();
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        className="cmd-palette-trigger-pill"
        onClick={() => {
          playSwitch();
          setIsOpen(true);
        }}
        title="Open Command Palette (Cmd + K)"
      >
        <span>🔍</span>
        <span className="cmd-label">Quick Search</span>
        <kbd className="cmd-kbd">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="modal-overlay" onClick={() => setIsOpen(false)}>
      <div className="cmd-palette-modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        {/* Search Chamber */}
        <div className="cmd-search-chamber">
          <span className="cmd-search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Type a command, job title, company, or action..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <kbd className="cmd-esc-tag" onClick={() => setIsOpen(false)}>ESC</kbd>
        </div>

        {/* Results List */}
        <div className="cmd-results-list">
          {filteredActions.length === 0 ? (
            <div className="cmd-empty-state">
              No matching commands or job drives found.
            </div>
          ) : (
            filteredActions.map((action, idx) => (
              <div
                key={action.id}
                className={`cmd-item ${idx === selectedIndex ? 'selected' : ''}`}
                onClick={() => {
                  action.run();
                  setIsOpen(false);
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <span className="cmd-item-icon">{action.icon}</span>
                <div className="cmd-item-info">
                  <div className="cmd-item-title">{action.title}</div>
                  {action.subtitle && (
                    <div className="cmd-item-sub">{action.subtitle}</div>
                  )}
                </div>
                <span className="cmd-item-cat">{action.category}</span>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="cmd-palette-footer">
          <span>Navigate with <kbd className="cmd-kbd">↑</kbd> <kbd className="cmd-kbd">↓</kbd></span>
          <span>Select with <kbd className="cmd-kbd">↵ Enter</kbd></span>
          <span>Close with <kbd className="cmd-kbd">ESC</kbd></span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
