const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_jwt_please_change_it'; // В ідеалі додати в .env

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// МІДЛВАР ДЛЯ ПЕРЕВІРКИ АВТОРИЗАЦІЇ
// ==========================================
const authenticateToken = (req, res, next) => {
    // Токен зазвичай передається в заголовку Authorization у форматі "Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ message: 'Потрібна авторизація (токен відсутній)' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Недійсний або прострочений токен' });
        req.user = user; // Зберігаємо дані користувача з токена у req.user
        next();
    });
};

// ==========================================
// АВТОРИЗАЦІЯ (USERS)
// ==========================================

// POST: Реєстрація нового користувача
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Заповніть всі поля: username, email, password' });
        }
        
        // Хешуємо пароль перед збереженням
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );
        
        res.status(201).json({ message: 'Користувача успішно створено', userId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Користувач з таким ім\'ям або email вже існує' });
        }
        res.status(500).json({ message: 'Помилка сервера', error: error.message });
    }
});

// POST: Вхід (Логін) та отримання токена
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Користувача не знайдено' });
        }
        
        const user = users[0];
        
        // Порівнюємо введений пароль із збереженим хешем
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Неправильний пароль' });
        }
        
        // Генеруємо JWT токен
        const token = jwt.sign(
            { id: user.id, username: user.username }, 
            JWT_SECRET, 
            { expiresIn: '2h' } // Токен дійсний 2 години
        );
        
        res.json({ message: 'Успішний вхід', token });
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error: error.message });
    }
});

// GET: Отримання інформації про поточного користувача (приклад захищеного роуту)
app.get('/api/users/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ message: 'Користувача не знайдено' });
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error: error.message });
    }
});

// ==========================================
// ЗАВДАННЯ (TASKS)
// ==========================================

// GET: Отримати всі завдання поточного користувача
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const [tasks] = await pool.query('SELECT * FROM tasks WHERE user_id = ?', [req.user.id]);
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error: error.message });
    }
});

// POST: Створити нове завдання
app.post('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title) return res.status(400).json({ message: 'Назва завдання є обов\'язковою' });
        
        const [result] = await pool.query(
            'INSERT INTO tasks (user_id, title, description) VALUES (?, ?, ?)',
            [req.user.id, title, description || null]
        );
        
        res.status(201).json({ message: 'Завдання створено', taskId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error: error.message });
    }
});

// PUT: Оновити завдання
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const { title, description, is_completed } = req.body;
        
        // Спочатку перевіряємо, чи належить це завдання поточному користувачу
        const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, req.user.id]);
        if (tasks.length === 0) return res.status(404).json({ message: 'Завдання не знайдено або доступ заборонено' });
        
        const currentTask = tasks[0];
        const newTitle = title !== undefined ? title : currentTask.title;
        const newDesc = description !== undefined ? description : currentTask.description;
        const newCompleted = is_completed !== undefined ? is_completed : currentTask.is_completed;
        
        await pool.query(
            'UPDATE tasks SET title = ?, description = ?, is_completed = ? WHERE id = ?',
            [newTitle, newDesc, newCompleted, taskId]
        );
        
        res.json({ message: 'Завдання оновлено' });
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error: error.message });
    }
});

// DELETE: Видалити завдання
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const [result] = await pool.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, req.user.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Завдання не знайдено або доступ заборонено' });
        }
        
        // Всі підзадачі видаляться автоматично завдяки ON DELETE CASCADE в базі даних
        res.json({ message: 'Завдання та всі його підзадачі успішно видалено' });
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error: error.message });
    }
});

// ==========================================
// ПІДЗАДАЧІ (SUBTASKS)
// ==========================================

// GET: Отримати всі підзадачі для конкретного завдання
app.get('/api/tasks/:taskId/subtasks', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.taskId;
        
        // Перевіряємо чи має користувач доступ до цього завдання
        const [tasks] = await pool.query('SELECT id FROM tasks WHERE id = ? AND user_id = ?', [taskId, req.user.id]);
        if (tasks.length === 0) return res.status(403).json({ message: 'Доступ заборонено або завдання не існує' });
        
        const [subtasks] = await pool.query('SELECT * FROM subtasks WHERE task_id = ?', [taskId]);
        res.json(subtasks);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error: error.message });
    }
});

// POST: Створити нову підзадачу до завдання
app.post('/api/tasks/:taskId/subtasks', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const { title } = req.body;
        
        if (!title) return res.status(400).json({ message: 'Назва підзадачі є обов\'язковою' });
        
        const [tasks] = await pool.query('SELECT id FROM tasks WHERE id = ? AND user_id = ?', [taskId, req.user.id]);
        if (tasks.length === 0) return res.status(403).json({ message: 'Доступ заборонено або завдання не існує' });
        
        const [result] = await pool.query('INSERT INTO subtasks (task_id, title) VALUES (?, ?)', [taskId, title]);
        res.status(201).json({ message: 'Підзадачу створено', subtaskId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error: error.message });
    }
});

// PUT: Оновити підзадачу
app.put('/api/subtasks/:id', authenticateToken, async (req, res) => {
    try {
        const subtaskId = req.params.id;
        const { title, is_completed } = req.body;
        
        // Перевіряємо чи підзадача належить завданню цього користувача
        const [subtasks] = await pool.query(
            `SELECT s.* FROM subtasks s 
             JOIN tasks t ON s.task_id = t.id 
             WHERE s.id = ? AND t.user_id = ?`, 
            [subtaskId, req.user.id]
        );
        
        if (subtasks.length === 0) return res.status(404).json({ message: 'Підзадачу не знайдено або доступ заборонено' });
        
        const currentSubtask = subtasks[0];
        const newTitle = title !== undefined ? title : currentSubtask.title;
        const newCompleted = is_completed !== undefined ? is_completed : currentSubtask.is_completed;
        
        await pool.query(
            'UPDATE subtasks SET title = ?, is_completed = ? WHERE id = ?',
            [newTitle, newCompleted, subtaskId]
        );
        
        res.json({ message: 'Підзадачу оновлено' });
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error: error.message });
    }
});

// DELETE: Видалити підзадачу
app.delete('/api/subtasks/:id', authenticateToken, async (req, res) => {
    try {
        const subtaskId = req.params.id;
        
        const [subtasks] = await pool.query(
            `SELECT s.id FROM subtasks s 
             JOIN tasks t ON s.task_id = t.id 
             WHERE s.id = ? AND t.user_id = ?`, 
            [subtaskId, req.user.id]
        );
        
        if (subtasks.length === 0) return res.status(404).json({ message: 'Підзадачу не знайдено або доступ заборонено' });
        
        await pool.query('DELETE FROM subtasks WHERE id = ?', [subtaskId]);
        res.json({ message: 'Підзадачу успішно видалено' });
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error: error.message });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущено за адресою http://localhost:${PORT}`);
});
