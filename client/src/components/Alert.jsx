import { CircleAlert, CircleCheck } from 'lucide-react';

export default function Alert({ type = 'error', children }) {
    const Icon = type === 'success' ? CircleCheck : CircleAlert;
    return (
        <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
            <Icon size={18} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{children}</span>
        </div>
    );
}
