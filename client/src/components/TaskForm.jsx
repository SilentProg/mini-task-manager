import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Alert from './Alert.jsx';

export default function TaskForm({ onSubmit }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();
        setPending(true);
        setError(null);
        try {
            await onSubmit(title.trim(), description.trim());
        } catch (err) {
            setError(err.message);
            setPending(false);
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="field">
                <label htmlFor="taskTitle">Назва завдання</label>
                <input
                    id="taskTitle"
                    className="input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={255}
                    autoFocus
                    required
                />
            </div>
            <div className="field">
                <label htmlFor="taskDesc">Детальний опис</label>
                <textarea
                    id="taskDesc"
                    className="input"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    aria-describedby="taskDescHint"
                />
                <span id="taskDescHint" className="hint">Необов'язково</span>
            </div>
            {error && <Alert>{error}</Alert>}
            <button type="submit" className="btn btn-primary btn-block" disabled={pending || !title.trim()}>
                {pending && <Loader2 size={18} className="spinner" aria-hidden="true" />}
                Зберегти завдання
            </button>
        </form>
    );
}
