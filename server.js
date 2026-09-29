const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для обробки JSON у тілі запиту
app.use(express.json());

// Зберігання даних у пам'яті (для простоти)
let tasks = [
    { id: 1, title: 'Вивчити Node.js', completed: false },
    { id: 2, title: 'Створити REST API', completed: false }
];

// GET: Отримати всі завдання
app.get('/api/tasks', (req, res) => {
    res.json(tasks);
});

// GET: Отримати завдання за його ID
app.get('/api/tasks/:id', (req, res) => {
    const task = tasks.find(t => t.id === parseInt(req.params.id));
    if (!task) return res.status(404).json({ message: 'Завдання не знайдено' });
    res.json(task);
});

// POST: Створити нове завдання
app.post('/api/tasks', (req, res) => {
    const { title, completed } = req.body;
    
    if (!title) {
        return res.status(400).json({ message: 'Назва завдання (title) є обов\'язковою' });
    }

    const newTask = {
        id: tasks.length ? tasks[tasks.length - 1].id + 1 : 1,
        title,
        completed: completed || false
    };

    tasks.push(newTask);
    res.status(201).json(newTask);
});

// PUT: Оновити існуюче завдання
app.put('/api/tasks/:id', (req, res) => {
    const task = tasks.find(t => t.id === parseInt(req.params.id));
    if (!task) return res.status(404).json({ message: 'Завдання не знайдено' });

    const { title, completed } = req.body;

    if (title !== undefined) task.title = title;
    if (completed !== undefined) task.completed = completed;

    res.json(task);
});

// DELETE: Видалити завдання
app.delete('/api/tasks/:id', (req, res) => {
    const taskIndex = tasks.findIndex(t => t.id === parseInt(req.params.id));
    if (taskIndex === -1) return res.status(404).json({ message: 'Завдання не знайдено' });

    const deletedTask = tasks.splice(taskIndex, 1);
    res.json(deletedTask[0]);
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущено за адресою http://localhost:${PORT}`);
});
