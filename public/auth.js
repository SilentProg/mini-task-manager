document.addEventListener('DOMContentLoaded', () => {
    // Якщо токен вже є, редірект на головну
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'index.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const alertBox = document.getElementById('authAlert');

    function showAlert(msg, isSuccess = false) {
        alertBox.textContent = msg;
        alertBox.className = `alert mt-4 mb-0 text-center alert-${isSuccess ? 'success' : 'danger'}`;
        alertBox.classList.remove('d-none');
    }

    // Обробка логіну
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Помилка виконання запиту');
            
            localStorage.setItem('token', data.token); // Зберігаємо JWT
            window.location.href = 'index.html'; // Переходимо в додаток
        } catch (err) {
            showAlert(err.message);
        }
    });

    // Обробка реєстрації
    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Помилка виконання запиту');
            
            showAlert('Успішно зареєстровано! Тепер увійдіть.', true);
            
            // Перемикаємось на вкладку логіну і підставляємо логін
            document.getElementById('login-tab').click();
            document.getElementById('loginUsername').value = username;
            registerForm.reset();
        } catch (err) {
            showAlert(err.message);
        }
    });
});
