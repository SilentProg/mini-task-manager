// ==========================================
// HTTP-КЛІЄНТ ДЛЯ РОБОТИ З EXPRESS API
// ==========================================
const TOKEN_KEY = 'token';

export const tokenStorage = {
    get: () => localStorage.getItem(TOKEN_KEY),
    set: (token) => localStorage.setItem(TOKEN_KEY, token),
    clear: () => localStorage.removeItem(TOKEN_KEY)
};

// Помилка, яку кидаємо, коли токен відсутній, недійсний або прострочений
export class UnauthorizedError extends Error {}

let onUnauthorized = () => {};

// AuthContext реєструє тут обробник, щоб розлогінити користувача при 401/403
export function setUnauthorizedHandler(handler) {
    onUnauthorized = handler;
}

export async function apiFetch(endpoint, { method = 'GET', body, auth = true } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const token = tokenStorage.get();
    if (auth && token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(endpoint, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
    });

    if (auth && (response.status === 401 || response.status === 403)) {
        onUnauthorized();
        throw new UnauthorizedError('Сесія завершилась, виконайте вхід знову');
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Помилка виконання запиту');
    return data;
}

// ==========================================
// МЕТОДИ API
// ==========================================
export const api = {
    login: (username, password) =>
        apiFetch('/api/login', { method: 'POST', body: { username, password }, auth: false }),
    register: (username, email, password) =>
        apiFetch('/api/register', { method: 'POST', body: { username, email, password }, auth: false }),
    me: () => apiFetch('/api/users/me'),

    getTasks: () => apiFetch('/api/tasks'),
    createTask: (title, description) =>
        apiFetch('/api/tasks', { method: 'POST', body: { title, description } }),
    updateTask: (id, fields) => apiFetch(`/api/tasks/${id}`, { method: 'PUT', body: fields }),
    deleteTask: (id) => apiFetch(`/api/tasks/${id}`, { method: 'DELETE' }),

    getSubtasks: (taskId) => apiFetch(`/api/tasks/${taskId}/subtasks`),
    createSubtask: (taskId, title) =>
        apiFetch(`/api/tasks/${taskId}/subtasks`, { method: 'POST', body: { title } }),
    updateSubtask: (id, fields) => apiFetch(`/api/subtasks/${id}`, { method: 'PUT', body: fields }),
    deleteSubtask: (id) => apiFetch(`/api/subtasks/${id}`, { method: 'DELETE' })
};
