# MNOONX Alpha Space

**MNOONX** — социальная платформа для крипто-аудитории: лента постов, профили, подписки, сообщества с приложениями (чат, курсы, события и др.), мессенджер и уведомления.

- Продукт и позиционирование: [ABOUT.md](ABOUT.md)
- Техническая документация для разработчиков и AI-агентов: [AGENTS.md](AGENTS.md)

## Что уже есть в продукте

| Область | Возможности |
|--------|-------------|
| **Соцсеть** | Регистрация/логин (JWT), лента, посты, лайки, репосты, профили `/@username`, подписки |
| **Discover** | Каталог сообществ (публичные и приватные), поиск, вступление |
| **Сообщества** | Создание, баннер/аватар, лента постов, join/leave, публичные/приватные, кодовое слово для входа, «участники могут постить» |
| **App Store** | Установка приложений в сообщество: Chat, Courses, Content, Files, Announcements, Events |
| **Мессенджер** | Team Mnoonx, Support, личные DM, поиск пользователей по username, непрочитанные |
| **Уведомления** | Mentions / All activity, группировка по времени |
| **Участники** | Список зарегистрированных пользователей, старт переписки |

Страницы **профиля** (`/@username`) и **настроек** (`/settings`) доступны только авторизованным пользователям.

## Структура репозитория

```
ai-assistant-dashboard/
├── client/          # React 18 + TypeScript + Tailwind (CRA)
│   └── src/
│       ├── pages/           # Home, Discover, Community*, Messenger, …
│       ├── components/      # Layout, Community panels, Auth
│       ├── context/         # AuthContext, UnreadsContext
│       └── constants/       # routes, community apps
├── server/          # Express + MongoDB (Mongoose)
│   ├── routes/      # auth, users, posts, communities, messages, notifications
│   ├── models/
│   ├── services/    # messaging (system chats, dedupe)
│   └── uploads/     # статика (брендинг, файлы сообществ)
├── README.md
├── ABOUT.md
└── AGENTS.md
```

## Требования

- **Node.js** 18+
- **MongoDB** (локально или Atlas)
- Переменные окружения в `server/.env`:
  - `MONGO_URI` — строка подключения MongoDB
  - `JWT_SECRET` — секрет для JWT
  - `PORT` (опционально, по умолчанию `5000`)

## Запуск

**Терминал 1 — API**

```bash
cd server
npm install
npm run dev
```

**Терминал 2 — фронтенд**

```bash
cd client
npm install
npm start
```

Фронтенд: [http://localhost:3000](http://localhost:3000)  
API: [http://localhost:5000](http://localhost:5000)

Из **корня** (после установки зависимостей в `client` и `server`):

```bash
npm run install:all   # первая установка
npm run server        # API
npm start             # клиент (в другом терминале)
```

## Основные URL (клиент)

| Путь | Страница |
|------|----------|
| `/` | Главная лента |
| `/discover` | Поиск сообществ |
| `/community/:handle` | Страница сообщества |
| `/community/:handle/settings` | Настройки сообщества (владелец) |
| `/community/:handle/store` | Магазин приложений |
| `/create-community` | Создание сообщества |
| `/@username` | Профиль (требуется вход) |
| `/post/:postId` | Отдельный пост |
| `/messenger` | Сообщения |
| `/notifications` | Уведомления |
| `/users` | Каталог пользователей |
| `/settings` | Настройки аккаунта (требуется вход) |
| `/new`, `/new/personal`, `/new/business` | Визард «новое» |

## Стек

| Слой | Технологии |
|------|------------|
| Клиент | React 18, TypeScript, Tailwind CSS, React Router v6, Lucide |
| Сервер | Node.js, Express, Mongoose, JWT, bcryptjs, Multer (загрузки) |
| БД | MongoDB |

## Лицензия

См. [LICENSE](LICENSE).
