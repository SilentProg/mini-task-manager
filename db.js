const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'mini_task_manager';

// Створюємо пул з'єднань для основного додатку
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Функція для перевірки та ініціалізації бази даних
async function initializeDB() {
  let tempConnection;
  try {
    // 1. Створюємо тимчасове з'єднання без вказання бази даних
    tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true // Дозволяє виконувати кілька SQL-запитів одночасно
    });
    
    console.log('Підключення до MySQL. Перевірка та відновлення бази даних...');
    
    // 2. Читаємо файл init.sql
    const initSqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(initSqlPath, 'utf8');
    
    // 3. Виконуємо SQL-запити з файлу
    await tempConnection.query(sql);
    
    console.log('Структуру бази даних успішно перевірено та відновлено з init.sql!');
  } catch (error) {
    console.error('Помилка під час ініціалізації бази даних:', error.message);
  } finally {
    // Закриваємо тимчасове з'єднання
    if (tempConnection) {
      await tempConnection.end();
    }
  }
}

// Запускаємо ініціалізацію
initializeDB();

// Експортуємо пул для використання в інших файлах (наприклад, у server.js)
module.exports = pool;
