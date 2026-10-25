import { ArrowLeft, Check, RotateCcw, Trash2 } from 'lucide-react';
import SubtaskList from './SubtaskList.jsx';

export default function TaskDetails({ task, onToggle, onDelete, onBack }) {
    return (
        <section className="panel details-panel" aria-labelledby="detail-title">
            <button type="button" className="btn btn-ghost back-btn" onClick={onBack}>
                <ArrowLeft size={18} aria-hidden="true" />
                До списку
            </button>

            <div className="details-header">
                <div className="details-heading">
                    <span className={`status-badge ${task.is_completed ? 'done' : ''}`}>
                        {task.is_completed ? 'Виконано' : 'В роботі'}
                    </span>
                    <h2 id="detail-title" className={task.is_completed ? 'completed' : ''}>
                        {task.title}
                    </h2>
                </div>
                <div className="details-actions">
                    <button
                        type="button"
                        className={`btn ${task.is_completed ? 'btn-outline' : 'btn-primary'}`}
                        onClick={onToggle}
                    >
                        {task.is_completed ? (
                            <><RotateCcw size={18} aria-hidden="true" /> Повернути в роботу</>
                        ) : (
                            <><Check size={18} aria-hidden="true" /> Помітити як виконано</>
                        )}
                    </button>
                    <button type="button" className="btn btn-danger" onClick={onDelete}>
                        <Trash2 size={18} aria-hidden="true" />
                        Видалити
                    </button>
                </div>
            </div>

            <p className={`details-description ${task.description ? '' : 'empty'}`}>
                {task.description || 'Опис відсутній'}
            </p>

            <SubtaskList taskId={task.id} />
        </section>
    );
}
