import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// Модальне вікно на основі нативного <dialog>: фокус утримується всередині, Esc закриває
export default function Modal({ open, title, onClose, children }) {
    const ref = useRef(null);

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    return (
        <dialog
            ref={ref}
            className="modal"
            aria-labelledby="modal-title"
            onClose={onClose}
            onClick={(e) => e.target === ref.current && onClose()}
        >
            <div className="modal-body">
                <div className="modal-header">
                    <h2 id="modal-title">{title}</h2>
                    <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрити">
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>
                {open && children}
            </div>
        </dialog>
    );
}
