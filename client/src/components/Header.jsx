import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo.jsx';

export default function Header() {
    const { user, logout } = useAuth();
    return (
        <header className="app-header">
            <div className="container app-header-inner">
                <Logo />
                <div className="app-header-user">
                    {user && (
                        <span className="user-chip" title={user.email}>
                            <span className="avatar" aria-hidden="true">
                                {user.username.charAt(0).toUpperCase()}
                            </span>
                            <span className="user-name">Привіт, {user.username}!</span>
                        </span>
                    )}
                    <button type="button" className="btn btn-ghost" onClick={logout}>
                        <LogOut size={18} aria-hidden="true" />
                        <span>Вийти</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
