import React from 'react';
import { Moon, Sun, BookOpen } from 'lucide-react';

export type Theme = 'midnight' | 'ivory' | 'dawn';

interface ThemeSwitcherProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentTheme, onThemeChange }) => {
  return (
    <div className="flex items-center gap-1 bg-brand-border/20 p-1 rounded-lg border border-brand-border/30">
      <button
        onClick={() => onThemeChange('midnight')}
        title="Midnight (Dark)"
        className={`p-1.5 rounded-md transition-all duration-200 ${
          currentTheme === 'midnight' 
            ? 'bg-brand-card text-brand-accent shadow-sm' 
            : 'text-brand-muted hover:text-brand-text'
        }`}
      >
        <Moon size={14} />
      </button>
      <button
        onClick={() => onThemeChange('ivory')}
        title="Ivory (Editorial)"
        className={`p-1.5 rounded-md transition-all duration-200 ${
          currentTheme === 'ivory' 
            ? 'bg-white text-amber-700 shadow-sm border border-stone-200' 
            : 'text-brand-muted hover:text-brand-text'
        }`}
      >
        <BookOpen size={14} />
      </button>
      <button
        onClick={() => onThemeChange('dawn')}
        title="Dawn (Light)"
        className={`p-1.5 rounded-md transition-all duration-200 ${
          currentTheme === 'dawn' 
            ? 'bg-white text-blue-600 shadow-sm border border-slate-200' 
            : 'text-brand-muted hover:text-brand-text'
        }`}
      >
        <Sun size={14} />
      </button>
    </div>
  );
};

export default ThemeSwitcher;