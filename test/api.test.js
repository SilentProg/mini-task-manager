// Unit-тести REST API. Справжня MySQL не потрібна: pool.query підміняється заглушкою.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = require('node:crypto').randomUUID();

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('node:crypto');

const pool = require('../db');
const app = require('../server');

// Черга відповідей для pool.query: кожен виклик забирає наступну
let queryResults;
let queryCalls;
pool.query = async (sql, params) => {
    queryCalls.push({ sql, params });
    const next = queryResults.shift();
    if (next instanceof Error) throw next;
    return next;
};

beforeEach(() => {
    queryResults = [];
    queryCalls = [];
});

const token = jwt.sign({ id: 1, username: 'yurii' }, process.env.JWT_SECRET);
const auth = { Authorization: `Bearer ${token}` };

// Паролі генеруються на кожен запуск, щоб у коді не було захардкоджених облікових даних
const PASSWORD = randomUUID();
const WRONG_PASSWORD = randomUUID();

describe('Реєстрація', () => {
    test('без обовʼязкових полів повертає 400', async () => {
        const res = await request(app).post('/api/register').send({ username: 'yurii' });
        assert.equal(res.status, 400);
        assert.equal(queryCalls.length, 0);
    });

    test('створює користувача і зберігає хеш, а не пароль', async () => {
        queryResults.push([{ insertId: 7 }]);
        const res = await request(app)
            .post('/api/register')
            .send({ username: 'yurii', email: 'y@example.com', password: PASSWORD });

        assert.equal(res.status, 201);
        assert.equal(res.body.userId, 7);
        const savedPassword = queryCalls[0].params[2];
        assert.notEqual(savedPassword, PASSWORD);
        assert.ok(await bcrypt.compare(PASSWORD, savedPassword));
    });

    test('дублікат користувача повертає 400', async () => {
        queryResults.push(Object.assign(new Error('Duplicate'), { code: 'ER_DUP_ENTRY' }));
        const res = await request(app)
            .post('/api/register')
            .send({ username: 'yurii', email: 'y@example.com', password: PASSWORD });
        assert.equal(res.status, 400);
    });
});

describe('Вхід', () => {
    test('невідомий користувач повертає 400', async () => {
        queryResults.push([[]]);
        const res = await request(app).post('/api/login').send({ username: 'nobody', password: 'x' });
        assert.equal(res.status, 400);
    });

    test('неправильний пароль повертає 400', async () => {
        const hash = await bcrypt.hash(PASSWORD, 4);
        queryResults.push([[{ id: 1, username: 'yurii', password: hash }]]);
        const res = await request(app).post('/api/login').send({ username: 'yurii', password: WRONG_PASSWORD });
        assert.equal(res.status, 400);
    });

    test('правильний пароль повертає валідний JWT', async () => {
        const hash = await bcrypt.hash(PASSWORD, 4);
        queryResults.push([[{ id: 1, username: 'yurii', password: hash }]]);
        const res = await request(app).post('/api/login').send({ username: 'yurii', password: PASSWORD });

        assert.equal(res.status, 200);
        const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
        assert.equal(payload.id, 1);
        assert.equal(payload.username, 'yurii');
    });
});

describe('Авторизація', () => {
    test('запит без токена повертає 401', async () => {
        const res = await request(app).get('/api/tasks');
        assert.equal(res.status, 401);
    });

    test('запит з недійсним токеном повертає 403', async () => {
        const res = await request(app).get('/api/tasks').set('Authorization', 'Bearer broken');
        assert.equal(res.status, 403);
    });
});

describe('Завдання', () => {
    test('повертає лише завдання поточного користувача', async () => {
        queryResults.push([[{ id: 1, title: 'Купити молоко' }]]);
        const res = await request(app).get('/api/tasks').set(auth);

        assert.equal(res.status, 200);
        assert.equal(res.body.length, 1);
        assert.deepEqual(queryCalls[0].params, [1]);
    });

    test('створення без назви повертає 400', async () => {
        const res = await request(app).post('/api/tasks').set(auth).send({ description: 'без назви' });
        assert.equal(res.status, 400);
    });

    test('створює завдання', async () => {
        queryResults.push([{ insertId: 42 }]);
        const res = await request(app).post('/api/tasks').set(auth).send({ title: 'Нове' });
        assert.equal(res.status, 201);
        assert.equal(res.body.taskId, 42);
    });

    test('оновлення чужого завдання повертає 404', async () => {
        queryResults.push([[]]);
        const res = await request(app).put('/api/tasks/5').set(auth).send({ title: 'x' });
        assert.equal(res.status, 404);
    });

    test('часткове оновлення зберігає незмінені поля', async () => {
        queryResults.push([[{ id: 5, title: 'Стара', description: 'Опис', is_completed: 0 }]]);
        queryResults.push([{ affectedRows: 1 }]);
        const res = await request(app).put('/api/tasks/5').set(auth).send({ is_completed: true });

        assert.equal(res.status, 200);
        assert.deepEqual(queryCalls[1].params, ['Стара', 'Опис', true, '5']);
    });

    test('видалення неіснуючого завдання повертає 404', async () => {
        queryResults.push([{ affectedRows: 0 }]);
        const res = await request(app).delete('/api/tasks/99').set(auth);
        assert.equal(res.status, 404);
    });
});

describe('Підзадачі', () => {
    test('доступ до підзадач чужого завдання повертає 403', async () => {
        queryResults.push([[]]);
        const res = await request(app).get('/api/tasks/5/subtasks').set(auth);
        assert.equal(res.status, 403);
    });

    test('створення підзадачі без назви повертає 400', async () => {
        const res = await request(app).post('/api/tasks/5/subtasks').set(auth).send({});
        assert.equal(res.status, 400);
    });
});

test('невідомий API-маршрут повертає JSON 404', async () => {
    const res = await request(app).get('/api/unknown');
    assert.equal(res.status, 404);
    assert.equal(res.body.message, 'Маршрут не знайдено');
});
