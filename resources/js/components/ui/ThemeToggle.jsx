import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Modern Theme Switcher.
 * Suitable for Navbar, Drawer, or standalone placement.
 * Toggles smoothly between Dark and Light mode.
 */
export default function ThemeToggle({ className = '', showLabel = false }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`group relative flex items-center justify-center gap-2 p-2 sm:p-2.5 rounded-xl transition-all duration-200 cursor-pointer border focus:outline-none focus:ring-2 focus:ring-magenta-500/50 hover:scale-105 active:scale-95 shrink-0 ${
        isDark
          ? 'bg-navy-800 hover:bg-navy-750 text-amber-300 border-slate-750 hover:border-amber-400/40 shadow-xs'
          : 'bg-white hover:bg-slate-50 text-purple-700 border-slate-300 hover:border-purple-300 shadow-xs'
      } ${className}`}
    >
      <div className="relative w-4.5 h-4.5 flex items-center justify-center shrink-0">
        {isDark ? (
          <Sun className="w-4.5 h-4.5 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
        ) : (
          <Moon className="w-4.5 h-4.5 text-purple-600 group-hover:-rotate-12 transition-transform duration-300" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-bold tracking-tight pr-1">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
}
