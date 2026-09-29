const mysql = require('mysql2');
require('dotenv').config();

// Створюємо пул з'єднань з базою даних
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mini_task_manager',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Перевірка з'єднання при запуску
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Помилка підключення до бази даних MySQL:', err.message);
  } else {
    console.log('Успішне підключення до бази даних MySQL');
    connection.release(); // Повертаємо з'єднання в пул
  }
});

// Експортуємо пул з підтримкою промісів (promises) для зручної роботи з async/await
module.exports = pool.promise();
