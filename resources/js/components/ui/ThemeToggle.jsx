import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Floating Theme Switcher at bottom-right corner.
 * Toggles smoothly between Dark and Light mode.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div className="fixed bottom-5 right-5 z-20 sm:z-30 sm:bottom-6 sm:right-6 select-none print:hidden">
      <button
        onClick={toggleTheme}
        type="button"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className={`group relative flex items-center gap-2.5 p-3 sm:px-4 sm:py-2.5 rounded-full shadow-2xl transition-all duration-200 cursor-pointer border focus:outline-none focus:ring-2 focus:ring-magenta-500/50 hover:scale-105 active:scale-95 ${
          isDark
            ? 'bg-navy-800/90 hover:bg-navy-750 text-amber-300 border-slate-700/80 shadow-black/50'
            : 'bg-white/95 hover:bg-slate-50 text-slate-800 border-slate-200 shadow-slate-900/10'
        }`}
      >
        {/* Glow halo */}
        <span
          className={`absolute -inset-0.5 rounded-full blur-sm opacity-50 group-hover:opacity-100 transition-opacity duration-200 -z-10 ${
            isDark
              ? 'bg-gradient-to-r from-amber-500/30 to-magenta-500/30'
              : 'bg-gradient-to-r from-purple-500/25 to-magenta-500/25'
          }`}
        />

        {/* Icon */}
        <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="w-5 h-5 text-purple-600 group-hover:-rotate-12 transition-transform duration-300" />
          )}
        </div>

        {/* Text pill label on desktop */}
        <span className="text-xs font-bold tracking-tight pr-0.5 hidden sm:inline-block">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      </button>
    </div>
  );
}
