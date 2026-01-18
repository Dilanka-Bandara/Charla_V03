import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button 
      className="theme-toggle glass-card"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <div className={`theme-toggle-icon ${isDark ? 'active' : ''}`}>
        {isDark ? <FiMoon size={20} /> : <FiSun size={20} />}
      </div>
    </button>
  );
};

export default ThemeToggle;
