import { useCallback, useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { api, UnauthorizedError } from '../api/client.js';
import Header from '../components/Header.jsx';
import TaskList from '../components/TaskList.jsx';
import TaskDetails from '../components/TaskDetails.jsx';
import TaskForm from '../components/TaskForm.jsx';
import Modal from '../components/Modal.jsx';
import Alert from '../components/Alert.jsx';
import './TasksPage.css';

export default function TasksPage() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [filter, setFilter] = useState('all');
    const [modal, setModal] = useState(null); // 'create' | 'delete' | null

    const selectedTask = tasks.find((t) => t.id === selectedId) || null;

    const handleError = useCallback((err) => {
        if (!(err instanceof UnauthorizedError)) setError(err.message);
    }, []);

    const loadTasks = useCallback(async () => {
        try {
            setTasks(await api.getTasks());
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    }, [handleError]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    async function createTask(title, description) {
        const { taskId } = await api.createTask(title, description);
        setModal(null);
        await loadTasks();
        setSelectedId(taskId);
    }

    async function toggleTask() {
        try {
            await api.updateTask(selectedTask.id, { is_completed: !selectedTask.is_completed });
            await loadTasks();
        } catch (err) {
            handleError(err);
        }
    }

    async function deleteTask() {
        try {
            await api.deleteTask(selectedTask.id);
            setModal(null);
            setSelectedId(null);
            await loadTasks();
        } catch (err) {
            setModal(null);
            handleError(err);
        }
    }

    return (
        <>
            <Header />
            <main className={`container tasks-layout ${selectedTask ? 'has-selection' : ''}`}>
                {error && (
                    <div className="tasks-error">
                        <Alert>{error}</Alert>
                    </div>
                )}

                <TaskList
                    tasks={tasks}
                    loading={loading}
                    selectedId={selectedId}
                    filter={filter}
                    onFilterChange={setFilter}
                    onSelect={(id) => {
                        setError(null);
                        setSelectedId(id);
                    }}
                    onCreate={() => setModal('create')}
                />

                {selectedTask ? (
                    <TaskDetails
                        key={selectedTask.id}
                        task={selectedTask}
                        onToggle={toggleTask}
                        onDelete={() => setModal('delete')}
                        onBack={() => setSelectedId(null)}
                    />
                ) : (
                    <section className="panel empty-state">
                        <ClipboardList size={56} strokeWidth={1.5} aria-hidden="true" />
                        <h2>Виберіть завдання зі списку</h2>
                        <p>або створіть нове, натиснувши «Додати»</p>
                    </section>
                )}
            </main>

            <Modal open={modal === 'create'} title="Нове завдання" onClose={() => setModal(null)}>
                <TaskForm onSubmit={createTask} />
            </Modal>

            <Modal open={modal === 'delete'} title="Видалити завдання?" onClose={() => setModal(null)}>
                <p className="confirm-text">
                    Завдання «{selectedTask?.title}» та всі його підзадачі буде видалено назавжди.
                </p>
                <div className="confirm-actions">
                    <button type="button" className="btn btn-outline" onClick={() => setModal(null)} autoFocus>
                        Скасувати
                    </button>
                    <button type="button" className="btn btn-danger" onClick={deleteTask}>
                        Видалити
                    </button>
                </div>
            </Modal>
        </>
    );
}
