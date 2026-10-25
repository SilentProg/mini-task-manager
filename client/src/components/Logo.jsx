import { ListChecks } from 'lucide-react';

export default function Logo({ size = 'md' }) {
    return (
        <span className={`logo logo-${size}`}>
            <span className="logo-mark" aria-hidden="true">
                <ListChecks size={size === 'lg' ? 26 : 20} strokeWidth={2.25} />
            </span>
            <span className="logo-text">Mini Task Manager</span>
        </span>
    );
}
