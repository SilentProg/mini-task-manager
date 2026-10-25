import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';
const ThemeContext = createContext(null);

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

function readStoredTheme() {
    try {
        const value = localStorage.getItem(STORAGE_KEY);
        return value === 'light' || value === 'dark' ? value : null;
    } catch {
        return null;
    }
}

export function ThemeProvider({ children }) {
    // Якщо користувач ще не обирав тему - беремо системну
    const [theme, setTheme] = useState(() => readStoredTheme() ?? (darkQuery().matches ? 'dark' : 'light'));

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
    }, [theme]);

    // Поки вибір не збережено, слідкуємо за зміною системної теми
    useEffect(() => {
        if (readStoredTheme()) return;
        const query = darkQuery();
        const onChange = (e) => setTheme(e.matches ? 'dark' : 'light');
        query.addEventListener('change', onChange);
        return () => query.removeEventListener('change', onChange);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme((current) => {
            const next = current === 'dark' ? 'light' : 'dark';
            try {
                localStorage.setItem(STORAGE_KEY, next);
            } catch {
                // localStorage недоступний (приватний режим) - тема діятиме до перезавантаження
            }
            return next;
        });
    }, []);

    return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme потрібно використовувати всередині ThemeProvider');
    return ctx;
}
