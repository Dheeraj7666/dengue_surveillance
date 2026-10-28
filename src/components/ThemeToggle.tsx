import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';

type ThemeToggleVariant = 'surface' | 'ghost';

interface ThemeToggleProps {
  /** `surface` sits on light panels, `ghost` sits on dark/transparent areas. */
  variant?: ThemeToggleVariant;
  className?: string;
}

const VARIANTS: Record<ThemeToggleVariant, string> = {
  surface:
    'bg-white text-slate-500 border border-slate-200 hover:text-teal-600 hover:border-teal-200 ' +
    'dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:text-teal-400 dark:hover:border-teal-800',
  ghost:
    'bg-white/10 text-slate-300 border border-white/10 hover:text-white hover:bg-white/20 ' +
    'dark:bg-white/5 dark:text-slate-300',
};

const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'surface', className = '' }) => {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      className={`relative inline-flex items-center justify-center h-9 w-9 rounded-xl transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${VARIANTS[variant]} ${className}`}
    >
      <Sun
        className={`absolute w-4 h-4 transition-all duration-300 ${
          isDark ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
        }`}
      />
      <Moon
        className={`absolute w-4 h-4 transition-all duration-300 ${
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'
        }`}
      />
    </button>
  );
};

export default ThemeToggle;
