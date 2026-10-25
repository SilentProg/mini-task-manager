import { CircleCheck, Circle, Plus } from 'lucide-react';

const FILTERS = [
    { id: 'all', label: 'Усі' },
    { id: 'active', label: 'Активні' },
    { id: 'done', label: 'Виконані' }
];

export default function TaskList({ tasks, loading, selectedId, filter, onFilterChange, onSelect, onCreate }) {
    const visible = tasks.filter((t) =>
        filter === 'active' ? !t.is_completed : filter === 'done' ? t.is_completed : true
    );
    const doneCount = tasks.filter((t) => t.is_completed).length;

    return (
        <section className="panel task-panel" aria-labelledby="tasks-heading">
            <div className="panel-header">
                <div>
                    <h2 id="tasks-heading">Мої завдання</h2>
                    <p className="panel-meta">
                        {tasks.length > 0 ? `Виконано ${doneCount} з ${tasks.length}` : 'Поки що порожньо'}
                    </p>
                </div>
                <button type="button" className="btn btn-accent" onClick={onCreate}>
                    <Plus size={18} aria-hidden="true" />
                    Додати
                </button>
            </div>

            <div className="filters" role="group" aria-label="Фільтр завдань">
                {FILTERS.map((f) => (
                    <button
                        key={f.id}
                        type="button"
                        className="filter"
                        aria-pressed={filter === f.id}
                        onClick={() => onFilterChange(f.id)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <ul className="task-list" aria-busy="true" aria-label="Завантаження завдань">
                    {[0, 1, 2].map((i) => (
                        <li key={i} className="skeleton" />
                    ))}
                </ul>
            ) : visible.length === 0 ? (
                <p className="empty-text">
                    {tasks.length === 0 ? 'Список пустий. Додайте нове завдання.' : 'Немає завдань у цій категорії.'}
                </p>
            ) : (
                <ul className="task-list">
                    {visible.map((task) => (
                        <li key={task.id}>
                            <button
                                type="button"
                                className="task-item"
                                aria-current={selectedId === task.id ? 'true' : undefined}
                                onClick={() => onSelect(task.id)}
                            >
                                {task.is_completed ? (
                                    <CircleCheck size={20} className="task-icon done" aria-label="Виконано" />
                                ) : (
                                    <Circle size={20} className="task-icon" aria-label="В роботі" />
                                )}
                                <span className={`task-title ${task.is_completed ? 'completed' : ''}`}>{task.title}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
