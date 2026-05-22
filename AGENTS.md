# MNOONX Alpha Space — документация для AI-агентов

## Краткое описание

**MNOONX Alpha Space** — full-stack социальная платформа для Web3/крипто: посты, подписки, лайки, репосты, сообщества с installable apps, мессенджер (system + DM), уведомления, Discover.

Монорепозиторий: `client/` (React) + `server/` (Express + MongoDB).

## Архитектура

| Слой | Стек |
|------|------|
| Фронтенд | React 18, TypeScript, Tailwind CSS, React Router v6, CRA |
| Бэкенд | Node.js, Express, Mongoose |
| Auth | JWT (`Authorization: Bearer`), bcryptjs |
| Файлы | `server/uploads/` — `express.static('/uploads')` |
| Стиль React | `React.FC`, хуки, `useCallback`, `useRef` |

### Контексты (клиент)

| Файл | Назначение |
|------|------------|
| `context/AuthContext.tsx` | `user`, `token`, login/register/logout, `localStorage` |
| `context/UnreadsContext.tsx` | Счётчики непрочитанных messages/notifications для шапки, poll 15s |

### Защита маршрутов

| Компонент | Где |
|-----------|-----|
| `components/Routing/RequireAuth.tsx` | `/settings`, профиль `/@username` (через `ProfileRoute`) |
| Гостевой UI | Messenger, Notifications — сообщение «Sign in» без редиректа |

## Роутинг клиента (`client/src/App.tsx`)

| Путь | Компонент | Auth |
|------|-----------|------|
| `/` | `Home` | — |
| `/discover` | `Discover` | — |
| `/community/:handle` | `CommunityPage` | опционально |
| `/community/:handle/settings` | `CommunitySettings` | owner |
| `/community/:handle/store` | `CommunityStore` | owner install |
| `/create-community` | `CreateCommunity` | — |
| `/:username` | `ProfileRoute` → `/@name` или 404 | профиль: **RequireAuth** |
| `/post/:postId` | `PostPage` | — |
| `/messenger` | `Messenger` | API 401 без token |
| `/notifications` | `Notifications` | API 401 без token |
| `/users` | `Users` | API 401 без token |
| `/settings` | `Settings` | **RequireAuth** |
| `/plan` | `Plan` | — |
| `/new`, `/new/personal`, `/new/business` | New* | — |

Профиль в UI: `profilePath(username)` → `/@username` (`constants/paths.ts`).

Зарезервированные сегменты (не профиль): `discover`, `settings`, `messenger`, `notifications`, `users`, `community`, `post`, `plan`, `create-community`, `new` — см. `ProfileUsernameRedirect.tsx`.

## API (сервер)

Базовый URL: `REACT_APP_API_URL` → `client/src/config/api.ts` (по умолчанию `http://localhost:5000`).

| Префикс | Файл | Назначение |
|---------|------|------------|
| `/auth` | `routes/auth.js` | register, login |
| `/users` | `routes/users.js` | `GET /list`, профиль, follow/unfollow |
| `/posts` | `routes/posts.js` | CRUD, like, repost; посты в community |
| `/communities` | `routes/communities.js` | CRUD, join/leave, posts, apps, chat, courses, files, announcements, events, branding |
| `/messages` | `routes/messages.js` | conversations, DM, unread |
| `/notifications` | `routes/notifications.js` | list, unread-count, mark read |

### Middleware `auth.js`

- Читает `Authorization: Bearer <token>`
- При ошибке/отсутствии: `req.userId = null` (не 401) — маршруты сами решают доступ
- Routes messages/notifications: явный 401 если нет `req.userId`

## Модели MongoDB (`server/models/`)

| Модель | Назначение |
|--------|------------|
| `User` | пользователь, счётчики, owned/joined communities |
| `Post` | пост; `author` — **строка** userId; `community` optional |
| `Follow` | `follower`, `following` — **строки** |
| `Community` | сообщество, members, apps, isPublic, membersCanPost, joinCode |
| `CommunityChatMessage`, `CommunityChatReadState` | чат в приложении |
| `CommunityCourse`, `CommunityContentDocument`, `CommunityFile` | apps |
| `CommunityAnnouncement`, `CommunityAnnouncementMeta` | announcements |
| `CommunityEvent` | events |
| `Conversation`, `DirectMessage`, `ConversationReadState` | мессенджер |
| `Notification` | уведомления in-app |

## Сообщества — важная логика

### Доступ (`routes/communities.js`)

- `canViewCommunity` — публичное или owner/member
- `canPostInCommunity` — owner всегда; member если `membersCanPost !== false`
- `GET /:handle` — 403 + `preview` для приватного без доступа
- `GET /list` — **все** сообщества (в т.ч. private) для Discover
- `serializeCommunityDoc` — `isMember`, `isOwner`, `canPost`, `requiresJoinCode`; `joinCode` только owner

### Join

- `POST /:handle/join` — body `{ joinCode }` если задан passphrase
- `members` — ObjectId; сравнение через `.toString()`

### Приложения

- `installedAppInstances[]`: `{ id, appId, title, visibleToMembers, note }`
- ID приложений: `chat`, `courses`, `content`, `files`, `announcements`, `events` (`client/src/constants/communityApps.ts`)
- Store UI: `CommunityStore.tsx`; панели: `Community*Panel.tsx` на `CommunityPage`

### Брендинг

- `POST /:handle/branding` — multipart `avatar` / `banner` → `/uploads/community-branding/...`

## Посты (`routes/posts.js`)

- `post.author` — строка, без `.populate()`
- Автор в ответе: `User.findById(author)`
- `isLiked` / `isReposted` по `req.userId` в массивах likes/reposts
- Создание в community: проверка member + `canPostInCommunity`
- Клиент: `Set<string>` для id постов в лайках

## Follow

```js
Follow.findOne({
  follower: userId.toString(),
  following: profileId.toString(),
});
```

GET профиля по username — middleware `auth` для `isFollowing`.

## Мессенджер (`services/messaging.js`)

- При первом запросе: `ensureUserMessaging(userId)` — system чаты + seed notifications
- `system_mnoonx`, `system_support` — по одному на пользователя (dedupe + unique index)
- DM: две записи `Conversation` (у каждого owner свой inbox)
- Unread: сообщения после `ConversationReadState.lastReadAt`
- `POST /dm/:username` — создать/открыть DM

## Уведомления

- Типы: `mention`, `post`, `event`, `community`, `system`
- `GET /?tab=mentions|all`
- Seed при первом входе (2 шт.)

## Ключевые файлы фронтенда

| Файл | Назначение |
|------|------------|
| `App.tsx` | Routes, Login/Register modals, providers |
| `components/Layout/AppLayout.tsx` | Sidebar + Header |
| `components/Layout/Header.tsx` | Search, badges Messages/Notifications |
| `components/Layout/Sidebar.tsx` | Nav, мои сообщества |
| `pages/Home.tsx` | Глобальная лента |
| `pages/UserProfile.tsx` | Профиль, посты, follow |
| `pages/CommunityPage.tsx` | Сообщество, apps, лента, private gate |
| `pages/CommunitySettings.tsx` | Visibility, joinCode, membersCanPost, delete |
| `pages/Discover.tsx` | Список сообществ |
| `pages/Messenger.tsx` | Чаты API, поиск users |
| `pages/Notifications.tsx` | Лента уведомлений |

## Типичные проблемы

1. **Пустой author** — не использовать populate; подставлять `User.findById`.
2. **Лайки сбрасываются** — отдавать `isLiked`/`isReposted` с сервера; ключи `Set` как `String(post._id)`.
3. **Follow не виден** — `auth` на GET профиля; ID строками.
4. **Дубликаты system-чатов** — гонка `ensureUserMessaging`; есть `dedupeSystemConversations` + unique index.
5. **Двойной `res.json()`** — один ответ на запрос.
6. **Link конфликт** — `Link` из `react-router-dom` vs `LinkIcon` из lucide.
7. **`req.userId`** — нормализовать к строке в `auth.js`.
8. **Приватное сообщество** — не вызывать `fetchPosts` без доступа; 403 → `privateGatePreview`.

## Команды

```bash
cd server && npm run dev    # API :5000
cd client && npm start      # UI :3000
```

### MongoDB shell

```js
db.users.find().pretty()
db.communities.find({ handle: "my-handle" }).pretty()
db.posts.find({ author: "USER_ID_STRING" }).pretty()
db.follows.find().pretty()
db.conversations.find({ ownerUserId: ObjectId("...") }).pretty()
```

## Переменные окружения (`server/.env`)

```
MONGO_URI=mongodb://127.0.0.1:27017/mnoonx
JWT_SECRET=your_secret_here
PORT=5000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
ADMIN_JWT_SECRET=optional_separate_secret
```

## Правила для агентов

- Менять только код, нужный для задачи; не рефакторить «заодно».
- Не коммитить без явной просьбы пользователя.
- После правок в `client/` — `npx tsc --noEmit` в `client/`.
- Не путать `div` с несуществующими тегами при правках JSX.
- Community routes файл очень большой — искать по `router.get/post` и имени фичи.
