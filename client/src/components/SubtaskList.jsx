import { useCallback, useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { api, UnauthorizedError } from '../api/client.js';
import Alert from './Alert.jsx';

export default function SubtaskList({ taskId }) {
    const [subtasks, setSubtasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [error, setError] = useState(null);

    const run = useCallback(async (action) => {
        setError(null);
        try {
            await action();
            setSubtasks(await api.getSubtasks(taskId));
        } catch (err) {
            if (!(err instanceof UnauthorizedError)) setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        run(async () => {});
    }, [run]);

    async function handleAdd(e) {
        e.preventDefault();
        const value = title.trim();
        if (!value) return;
        setTitle('');
        await run(() => api.createSubtask(taskId, value));
    }

    const doneCount = subtasks.filter((s) => s.is_completed).length;
    const progress = subtasks.length ? Math.round((doneCount / subtasks.length) * 100) : 0;

    return (
        <section className="subtasks" aria-labelledby="subtasks-heading">
            <div className="subtasks-header">
                <h3 id="subtasks-heading">Підзадачі</h3>
                {subtasks.length > 0 && (
                    <span className="panel-meta">{doneCount} / {subtasks.length}</span>
                )}
            </div>

            {subtasks.length > 0 && (
                <div
                    className="progress"
                    role="progressbar"
                    aria-label="Прогрес підзадач"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                >
                    <div className="progress-bar" style={{ transform: `scaleX(${progress / 100})` }} />
                </div>
            )}

            <form className="subtask-form" onSubmit={handleAdd}>
                <label htmlFor="subtaskInput" className="visually-hidden">Нова підзадача</label>
                <input
                    id="subtaskInput"
                    className="input"
                    placeholder="Що ще потрібно зробити?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={255}
                />
                <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
                    <Plus size={18} aria-hidden="true" />
                    <span>Додати</span>
                </button>
            </form>

            {error && <Alert>{error}</Alert>}

            {loading ? (
                <p className="empty-text">Завантаження...</p>
            ) : subtasks.length === 0 ? (
                <p className="empty-text">Немає підзадач</p>
            ) : (
                <ul className="subtask-list">
                    {subtasks.map((st) => (
                        <li key={st.id} className="subtask-item">
                            <label className="subtask-check">
                                <input
                                    type="checkbox"
                                    checked={Boolean(st.is_completed)}
                                    onChange={(e) =>
                                        run(() => api.updateSubtask(st.id, { is_completed: e.target.checked }))
                                    }
                                />
                                <span className={st.is_completed ? 'completed' : ''}>{st.title}</span>
                            </label>
                            <button
                                type="button"
                                className="icon-btn danger"
                                onClick={() => run(() => api.deleteSubtask(st.id))}
                                aria-label={`Видалити підзадачу «${st.title}»`}
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
