# Mini Task Manager

**Mini Task Manager** — це базовий веб-додаток для керування списком повсякденних завдань. Проєкт створено з метою демонстрації навичок роботи з розподіленою системою контролю версій Git та платформою GitHub у рамках виконання лабораторної роботи.

## Опис проєкту

Додаток побудований за модульним принципом і складається з двох основних частин:

*   **Бекенд:** Простий HTTP-сервер для обробки запитів.
*   **Фронтенд:** Мінімалістичний користувацький інтерфейс для відображення завдань.

Проєкт орієнтований на відпрацювання стратегії розгалуження (branching), злиття гілок (merge) та вирішення конфліктів при паралельній розробці компонентів.

## Технологічний стек

*   **Backend:** Node.js, Express.js
*   **База даних:** MySQL
*   **Аутентифікація:** JWT (JSON Web Tokens), bcrypt
*   **Frontend:** React 19, React Router, Vite, lucide-react (іконки)
*   **Дизайн-система:** згенерована skill [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
*   **Система контролю версій:** Git, GitHub

## API Маршрути (Routes)

Усі маршрути (окрім реєстрації та логіну) є захищеними і вимагають токена авторизації у заголовку запиту: 
`Authorization: Bearer <token>`

### 👤 Авторизація (Користувачі)
*   **`POST /api/register`** — Реєстрація нового користувача. Тіло запиту: `username`, `email`, `password`.
*   **`POST /api/login`** — Вхід користувача. Тіло запиту: `username`, `password`. Повертає JWT токен.
*   **`GET /api/users/me`** — Отримання інформації про поточного авторизованого користувача.

### 📋 Завдання (Tasks)
*   **`GET /api/tasks`** — Отримати список усіх завдань поточного користувача.
*   **`POST /api/tasks`** — Створити нове завдання. Тіло запиту: `title` (обов'язково), `description` (необов'язково).
*   **`PUT /api/tasks/:id`** — Оновити існуюче завдання. Тіло запиту (опціонально): `title`, `description`, `is_completed`.
*   **`DELETE /api/tasks/:id`** — Видалити завдання (всі прив'язані підзадачі видаляться автоматично).

### 📝 Підзадачі (Subtasks)
*   **`GET /api/tasks/:taskId/subtasks`** — Отримати всі підзадачі для конкретного завдання.
*   **`POST /api/tasks/:taskId/subtasks`** — Створити нову підзадачу. Тіло запиту: `title`.
*   **`PUT /api/subtasks/:id`** — Оновити підзадачу. Тіло запиту (опціонально): `title`, `is_completed`.
*   **`DELETE /api/subtasks/:id`** — Видалити підзадачу.

## Запуск проєкту

1. Встановити залежності бекенду: `npm install`
2. Створити файл `.env` (за потреби) зі змінними `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `PORT`.
3. Зібрати фронтенд: `npm run build` (встановлює залежності `client/` і збирає їх у `client/dist`).
4. Запустити сервер: `npm start` і відкрити `http://localhost:3000`.

> Файл `client/dist/index.html` не можна відкривати напряму з диска (`file://`): браузер блокує ES-модулі з такого джерела, а API та маршрутизація працюють лише через сервер. Відкривайте застосунок тільки через `http://localhost:3000`.

Для розробки фронтенду з гарячим перезавантаженням запустіть `npm start` в одному терміналі та `npm run dev:client` в іншому, після чого відкрийте `http://localhost:5173`. Vite проксує запити `/api` на Express-сервер.

## Фронтенд (Клієнтська частина)

Клієнтська частина розміщена у папці `client` і є Single Page Application на **React**, зібраною через **Vite**. Express роздає готову збірку з `client/dist`, а для всіх не-API маршрутів повертає `index.html`, щоб працювала клієнтська маршрутизація (React Router).

Візуальний стиль (Flat Design, палітра teal + orange, шрифт Plus Jakarta Sans, відступи та специфікації компонентів) підібраний за допомогою skill **ui-ux-pro-max**. Дизайн-токени підключені як CSS-змінні у `client/src/styles/index.css`, є світла та темна теми.

### Структура `client/src`:
1. **`api/client.js`** — функція `apiFetch`, яка підписує запити JWT-токеном, та набір методів для всіх маршрутів API. При відповіді 401/403 користувача автоматично розлогінює.
2. **`context/AuthContext.jsx`** — зберігає токен у `localStorage`, завантажує профіль (`/api/users/me`), надає `login`/`logout`.
3. **`App.jsx`** — маршрути `/` (захищений) та `/auth` (лише для гостей).
4. **`pages/AuthPage.jsx`** — вкладки «Вхід» / «Реєстрація» з підтримкою клавіатури, показом пароля та повідомленнями про помилки.
5. **`pages/TasksPage.jsx`** — головний екран: список завдань з фільтрами та прогресом, деталі обраного завдання, створення в модальному вікні та підтвердження видалення.
6. **`components/`** — `Header`, `TaskList`, `TaskDetails`, `SubtaskList`, `TaskForm`, `Modal` (на основі `<dialog>`), `Alert`, `PasswordInput`, `Logo`.

### Доступність та UX
* Видимі підписи полів, видимий фокус, мінімальний розмір елементів керування 44px.
* Іконки SVG (lucide-react) замість емодзі, кнопки з іконками мають `aria-label`.
* Перемикач світлої та темної теми (кнопка в шапці і на сторінці входу). Вибір зберігається в `localStorage`, а за замовчуванням береться системна тема.
* Підтримка `prefers-reduced-motion`.
* Адаптивний макет: на мобільних список і деталі завдання відкриваються по черзі.

## Тести та CI (Jenkins)

- `npm run lint` — ESLint для бекенду (`server.js`, `db.js`) і React-клієнта (`client/src`).
- `npm test` — unit-тести REST API (`test/api.test.js`, вбудований `node:test` + `supertest`). База даних підміняється заглушкою, тому MySQL для тестів не потрібна.
- `npm run test:ci` — ті самі тести зі звітом JUnit у `reports/junit.xml` для Jenkins.

`Jenkinsfile` описує пайплайн: **Checkout → Install → Lint → Unit tests → Build client → Archive → Docker build → Docker push → Deploy** (останні дві стадії вмикаються параметрами `PUSH_IMAGE` і `DEPLOY`). Збірка запускається кнопкою «Build Now» або автоматично вебхуком GitHub (`<адреса Jenkins>/github-webhook/`).

## Docker

| Файл | Призначення |
|---|---|
| `Dockerfile` | Багатоетапна збірка: React-клієнт (Vite) → production-залежності → фінальний образ `node:22-alpine` від користувача `node` з `HEALTHCHECK` на `/api/health`. |
| `docker-compose.yml` | Стек `nginx → app (N екземплярів) → MySQL 8.4`, власна мережа `mtm-net`, том `mtm-mysql-data`, обмеження CPU/пам'яті. |
| `docker/nginx/default.conf` | nginx балансує запити між усіма екземплярами `app` (DNS Docker, round-robin) і пише в журнал, який екземпляр відповів. |
| `docker-compose.monitoring.yml` | cAdvisor (`:8082`) і Prometheus (`:9090`, конфіг `monitoring/prometheus.yml`). |
| `scripts/docker-start.sh` | Запуск однією командою: перевіряє Docker, створює `.env` з випадковими паролями, перевіряє вільний порт, збирає й піднімає стек і чекає на `/api/health`. |
| `scripts/rolling-update.sh` | Оновлення до нової версії без простою: нові екземпляри стартують поруч зі старими, старі зупиняються після healthcheck. |
| `k8s/mini-task-manager.yaml` | Той самий стек у Kubernetes (Deployment з RollingUpdate, Service, Secret, PVC). |

```bash
./scripts/docker-start.sh               # усе одразу: .env, збірка, запуск, перевірка
./scripts/docker-start.sh --monitoring  # + cAdvisor і Prometheus
./scripts/docker-start.sh stop          # зупинити (status, logs — стан і журнали)

# або вручну:
cp .env.example .env                 # змініть паролі
docker compose up -d --build         # http://localhost:8088
docker compose up -d --scale app=3   # масштабування
./scripts/rolling-update.sh 1.1      # оновлення без простою
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d   # + моніторинг
```

`GET /api/health` повертає `{ status, version, instance }`: версію образу (`APP_VERSION`) та ім'я контейнера, що обробив запит.
