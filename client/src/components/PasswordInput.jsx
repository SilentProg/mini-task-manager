import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({ id, value, onChange, autoComplete }) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="password-input">
            <input
                id={id}
                className="input"
                type={visible ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
                required
            />
            <button
                type="button"
                className="icon-btn"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Приховати пароль' : 'Показати пароль'}
                aria-pressed={visible}
            >
                {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
        </div>
    );
}
