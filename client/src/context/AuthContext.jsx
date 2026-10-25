import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStorage, UnauthorizedError } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => tokenStorage.get());
    const [user, setUser] = useState(null);

    const logout = useCallback(() => {
        tokenStorage.clear();
        setToken(null);
        setUser(null);
    }, []);

    const login = useCallback(async (username, password) => {
        const { token: newToken } = await api.login(username, password);
        tokenStorage.set(newToken);
        setToken(newToken);
    }, []);

    // Будь-яка відповідь 401/403 від API розлогінює користувача
    useEffect(() => {
        setUnauthorizedHandler(logout);
    }, [logout]);

    // Після входу підтягуємо профіль поточного користувача
    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        api.me()
            .then((profile) => !cancelled && setUser(profile))
            .catch((err) => {
                // При недійсному токені apiFetch вже розлогінив користувача
                if (!(err instanceof UnauthorizedError)) console.error('Помилка завантаження профілю', err);
            });
        return () => {
            cancelled = true;
        };
    }, [token]);

    const value = useMemo(
        () => ({ token, user, isAuthenticated: Boolean(token), login, logout }),
        [token, user, login, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth потрібно використовувати всередині AuthProvider');
    return ctx;
}
