import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Alert from '../components/Alert.jsx';
import Logo from '../components/Logo.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import './AuthPage.css';

const TABS = [
    { id: 'login', label: 'Вхід' },
    { id: 'register', label: 'Реєстрація' }
];

export default function AuthPage() {
    const { login } = useAuth();
    const [tab, setTab] = useState('login');
    const [message, setMessage] = useState(null); // { type: 'error' | 'success', text }
    const [pending, setPending] = useState(false);
    const tabRefs = useRef({});

    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '' });

    function switchTab(id) {
        setTab(id);
        setMessage(null);
    }

    // Перемикання вкладок стрілками (патерн WAI-ARIA Tabs)
    function onTabKeyDown(e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        const next = tab === 'login' ? 'register' : 'login';
        switchTab(next);
        tabRefs.current[next]?.focus();
    }

    async function handleLogin(e) {
        e.preventDefault();
        setPending(true);
        setMessage(null);
        try {
            await login(loginForm.username, loginForm.password);
            // Після зміни токена GuestRoute сам перенаправить на головну
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
            setPending(false);
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        setPending(true);
        setMessage(null);
        try {
            const { username, email, password } = registerForm;
            await api.register(username, email, password);
            // Перемикаємось на вкладку входу і підставляємо логін
            setLoginForm({ username, password: '' });
            setRegisterForm({ username: '', email: '', password: '' });
            setTab('login');
            setMessage({ type: 'success', text: 'Успішно зареєстровано! Тепер увійдіть.' });
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setPending(false);
        }
    }

    return (
        <main className="auth-page">
            <ThemeToggle className="auth-theme-toggle" />
            <section className="auth-card" aria-labelledby="auth-title">
                <header className="auth-header">
                    <Logo size="lg" />
                    <h1 id="auth-title" className="auth-title">
                        {tab === 'login' ? 'З поверненням!' : 'Створіть акаунт'}
                    </h1>
                    <p className="auth-subtitle">
                        {tab === 'login'
                            ? 'Увійдіть, щоб продовжити роботу із завданнями.'
                            : 'Реєстрація займе менше хвилини.'}
                    </p>
                </header>

                <div className="tabs" role="tablist" aria-label="Спосіб входу">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            ref={(el) => (tabRefs.current[t.id] = el)}
                            id={`tab-${t.id}`}
                            type="button"
                            role="tab"
                            className="tab"
                            aria-selected={tab === t.id}
                            aria-controls={`panel-${t.id}`}
                            tabIndex={tab === t.id ? 0 : -1}
                            onClick={() => switchTab(t.id)}
                            onKeyDown={onTabKeyDown}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab === 'login' ? (
                    <form id="panel-login" role="tabpanel" aria-labelledby="tab-login" onSubmit={handleLogin} className="auth-form">
                        <div className="field">
                            <label htmlFor="loginUsername">Ім’я користувача</label>
                            <input
                                id="loginUsername"
                                className="input"
                                autoComplete="username"
                                value={loginForm.username}
                                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                                required
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="loginPassword">Пароль</label>
                            <PasswordInput
                                id="loginPassword"
                                autoComplete="current-password"
                                value={loginForm.password}
                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
                            {pending && <Loader2 size={18} className="spinner" aria-hidden="true" />}
                            Увійти
                        </button>
                    </form>
                ) : (
                    <form id="panel-register" role="tabpanel" aria-labelledby="tab-register" onSubmit={handleRegister} className="auth-form">
                        <div className="field">
                            <label htmlFor="regUsername">Ім’я користувача</label>
                            <input
                                id="regUsername"
                                className="input"
                                autoComplete="username"
                                value={registerForm.username}
                                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                                required
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="regEmail">Email</label>
                            <input
                                id="regEmail"
                                type="email"
                                className="input"
                                autoComplete="email"
                                value={registerForm.email}
                                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="regPassword">Пароль</label>
                            <PasswordInput
                                id="regPassword"
                                autoComplete="new-password"
                                value={registerForm.password}
                                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn btn-accent btn-block" disabled={pending}>
                            {pending && <Loader2 size={18} className="spinner" aria-hidden="true" />}
                            Зареєструватися
                        </button>
                    </form>
                )}

                <div aria-live="polite">
                    {message && <Alert type={message.type}>{message.text}</Alert>}
                </div>
            </section>
        </main>
    );
}
