document.addEventListener('DOMContentLoaded', () => {
    // Перевірка токену
    const token = localStorage.getItem('token');
    
    // Якщо немає токена - на авторизацію
    if (!token) {
        window.location.href = 'auth.html';
        return;
    }

    // === ГЛОБАЛЬНА ФУНКЦІЯ ДЛЯ FETCH ЗАПИТІВ З ТОКЕНОМ ===
    async function apiFetch(endpoint, method = 'GET', body = null) {
        const headers = { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        
        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);
        
        try {
            const response = await fetch(endpoint, options);
            
            // 401 або 403 - Токен прострочено або недійсний
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                window.location.href = 'auth.html';
                throw new Error('Не авторизовано, виконайте вхід знову');
            }
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Помилка виконання запиту');
            
            return data;
        } catch (error) {
            throw error;
        }
    }

    // ==========================================
    // ЛОГІКА ОСНОВНОГО ДОДАТКУ (index.html)
    // ==========================================
    let currentTaskId = null;

    const taskListEl = document.getElementById('taskList');
    const taskDetailsEl = document.getElementById('taskDetails');
    const noTaskSelectedEl = document.getElementById('noTaskSelected');
    
    // Ініціалізація
    loadUserProfile();
    loadTasks();

    // Вихід з аккаунту
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'auth.html';
    });

    async function loadUserProfile() {
        try {
            const user = await apiFetch('/api/users/me');
            document.getElementById('userInfo').textContent = `Привіт, ${user.username}!`;
        } catch (err) {
            console.error('Помилка завантаження профілю', err);
        }
    }

    // --- РОБОТА ІЗ ЗАВДАННЯМИ (TASKS) ---

    async function loadTasks() {
        try {
            const tasks = await apiFetch('/api/tasks');
            taskListEl.innerHTML = '';
            
            if (tasks.length === 0) {
                taskListEl.innerHTML = '<div class="p-4 text-center text-muted">Список пустий. Додайте нове завдання.</div>';
                // Якщо список порожній, скидаємо виділення
                if(currentTaskId) {
                    currentTaskId = null;
                    taskDetailsEl.style.display = 'none';
                    noTaskSelectedEl.style.display = 'flex';
                }
                return;
            }

            // Створюємо елементи для кожного завдання
            tasks.forEach(task => {
                const item = document.createElement('div');
                item.className = `list-group-item task-item px-3 py-3 ${currentTaskId === task.id ? 'task-active' : ''}`;
                
                const titleClass = task.is_completed ? 'task-completed' : 'text-dark fw-medium';
                const icon = task.is_completed 
                    ? '<span class="badge bg-success rounded-circle p-1"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-check" viewBox="0 0 16 16"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/></svg></span>' 
                    : '';
                    
                item.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="${titleClass}">${task.title}</span>
                        ${icon}
                    </div>
                `;
                
                item.addEventListener('click', () => {
                    // Візуальне виділення активного завдання
                    document.querySelectorAll('.task-item').forEach(el => el.classList.remove('task-active'));
                    item.classList.add('task-active');
                    selectTask(task);
                });
                
                taskListEl.appendChild(item);
                
                // Якщо після оновлення ми все ще маємо відкрите завдання - оновлюємо його деталі
                if(currentTaskId === task.id) {
                    selectTask(task, false); 
                }
            });
        } catch (err) {
            console.error('Помилка завантаження завдань', err);
        }
    }

    // Відображення деталей обраного завдання
    function selectTask(task, shouldLoadSubtasks = true) {
        currentTaskId = task.id;
        
        noTaskSelectedEl.style.display = 'none';
        taskDetailsEl.style.display = 'block';
        
        const titleEl = document.getElementById('detailTitle');
        titleEl.textContent = task.title;
        
        if (task.is_completed) {
            titleEl.classList.add('task-completed');
        } else {
            titleEl.classList.remove('task-completed');
        }
        
        const descEl = document.getElementById('detailDescription');
        descEl.textContent = task.description || 'Опис відсутній';
        descEl.classList.toggle('fst-italic', !task.description);
        
        // Налаштування кнопок "Виконано/Повернути"
        const btnComplete = document.getElementById('btnToggleComplete');
        btnComplete.textContent = task.is_completed ? 'Повернути в роботу' : 'Помітити як виконано';
        btnComplete.className = `btn btn-sm rounded-pill px-3 shadow-sm ${task.is_completed ? 'btn-secondary' : 'btn-success'}`;
        
        // Використовуємо onmousedown замість onclick, щоб не множилися івенти
        btnComplete.onclick = () => toggleTaskComplete(task);
        document.getElementById('btnDeleteTask').onclick = () => deleteTask(task.id);
        
        if(shouldLoadSubtasks) {
            loadSubtasks(task.id);
        }
    }

    // Створення нового завдання
    document.getElementById('taskForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDesc').value;
        
        try {
            await apiFetch('/api/tasks', 'POST', { title, description });
            
            // Закриваємо модалку Bootstrap
            const modal = bootstrap.Modal.getInstance(document.getElementById('taskModal'));
            modal.hide();
            e.target.reset();
            
            loadTasks(); // Оновлюємо список
        } catch (err) {
            alert(err.message);
        }
    });

    // Зміна статусу завдання
    async function toggleTaskComplete(task) {
        try {
            await apiFetch(`/api/tasks/${task.id}`, 'PUT', { is_completed: !task.is_completed });
            loadTasks(); // Оновлюємо список (це автоматично оновить і деталі, оскільки id збережено)
        } catch (err) {
            alert(err.message);
        }
    }

    // Видалення завдання
    async function deleteTask(taskId) {
        if(!confirm('Ви впевнені, що хочете видалити це завдання? Усі підзадачі також зникнуть!')) return;
        try {
            await apiFetch(`/api/tasks/${taskId}`, 'DELETE');
            currentTaskId = null;
            taskDetailsEl.style.display = 'none';
            noTaskSelectedEl.style.display = 'flex';
            loadTasks();
        } catch (err) {
            alert(err.message);
        }
    }

    // --- РОБОТА З ПІДЗАДАЧАМИ (SUBTASKS) ---
    
    const subtaskListEl = document.getElementById('subtaskList');
    
    async function loadSubtasks(taskId) {
        try {
            const subtasks = await apiFetch(`/api/tasks/${taskId}/subtasks`);
            subtaskListEl.innerHTML = '';
            
            if (subtasks.length === 0) {
                subtaskListEl.innerHTML = '<li class="list-group-item text-muted border-0 ps-0 fst-italic">Немає підзадач</li>';
                return;
            }
            
            subtasks.forEach(st => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                
                li.innerHTML = `
                    <div class="form-check d-flex align-items-center mb-0">
                        <input class="form-check-input me-3 mt-0 subtask-check" type="checkbox" ${st.is_completed ? 'checked' : ''}>
                        <span class="${st.is_completed ? 'task-completed' : ''}">${st.title}</span>
                    </div>
                    <button class="btn btn-link text-muted btn-delete-subtask border-0 p-0 text-decoration-none" title="Видалити">&times;</button>
                `;
                
                li.querySelector('.subtask-check').addEventListener('change', (e) => {
                    toggleSubtaskComplete(st, e.target.checked);
                });
                
                li.querySelector('.btn-delete-subtask').addEventListener('click', () => {
                    deleteSubtask(st.id, taskId);
                });
                
                subtaskListEl.appendChild(li);
            });
        } catch (err) {
            console.error('Помилка завантаження підзадач', err);
        }
    }

    // Додавання підзадачі
    document.getElementById('subtaskForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!currentTaskId) return;
        
        const titleInput = document.getElementById('subtaskInput');
        try {
            await apiFetch(`/api/tasks/${currentTaskId}/subtasks`, 'POST', { title: titleInput.value });
            titleInput.value = '';
            loadSubtasks(currentTaskId); // Оновлюємо список підзадач
        } catch (err) {
            alert(err.message);
        }
    });

    // Зміна статусу підзадачі
    async function toggleSubtaskComplete(subtask, is_completed) {
        try {
            await apiFetch(`/api/subtasks/${subtask.id}`, 'PUT', { is_completed });
            loadSubtasks(currentTaskId);
        } catch (err) {
            alert(err.message);
        }
    }

    // Видалення підзадачі
    async function deleteSubtask(subtaskId, taskId) {
        try {
            await apiFetch(`/api/subtasks/${subtaskId}`, 'DELETE');
            loadSubtasks(taskId);
        } catch (err) {
            alert(err.message);
        }
    }
});
