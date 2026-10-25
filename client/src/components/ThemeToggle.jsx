import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemeToggle({ className = '' }) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const label = isDark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему';

    return (
        <button type="button" className={`icon-btn theme-toggle ${className}`} onClick={toggleTheme} aria-label={label} title={label}>
            {isDark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
        </button>
    );
}
