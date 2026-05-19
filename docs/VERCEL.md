# Деплой на Vercel

Vercel хостит **только фронтенд** (CRA в `client/`). Express API и MongoDB нужно разместить отдельно (Railway, Render, Fly.io, VPS и т.д.).

## 1. Бэкенд (обязательно до продакшена)

1. Разверните `server/` на платформе с постоянным процессом и диском для `uploads/`.
2. Задайте переменные (см. `server/env.example`):
   - `MONGO_URI` — MongoDB Atlas или свой инстанс
   - `JWT_SECRET` — длинная случайная строка
   - `CLIENT_ORIGIN` — URL фронта на Vercel, например:  
     `https://your-app.vercel.app,http://localhost:3000`
3. Запомните публичный URL API, например `https://api.example.com`.

## 2. Фронтенд на Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → импорт Git-репозитория.
2. **Root Directory** оставьте **корень репозитория** (там лежит `vercel.json`).
3. Framework Preset: **Other** (сборка задаётся в `vercel.json`).
4. **Environment Variables** (Production, Preview, Development):

   | Имя | Значение |
   |-----|----------|
   | `REACT_APP_API_URL` | `https://api.example.com` (без `/api` в конце) |

5. Deploy.

На Vercel `CI=true` по умолчанию — ESLint warnings ломают CRA build. В `vercel.json` уже стоит `CI=false` в buildCommand (или добавь переменную `CI` = `false` в Environment).

`vercel.json` уже настроен:

- `installCommand` / `buildCommand` — сборка из `client/`
- `outputDirectory` — `client/build`
- `rewrites` — SPA fallback для React Router

## 3. Локальная проверка перед деплоем

```bash
cd client
cp env.example .env.local
# отредактируйте REACT_APP_API_URL при необходимости
npm ci
npm run build
```

```bash
cd client
npx tsc --noEmit
```

## 4. После деплоя

- Откройте сайт на Vercel и проверьте логин, ленту, загрузку медиа (`/uploads/...` идут с origin API).
- Если CORS-ошибки — добавьте точный origin (с `https://`) в `CLIENT_ORIGIN` на сервере и перезапустите API.
- Preview-деплои: при необходимости добавьте `https://*-your-team.vercel.app` в `CLIENT_ORIGIN` или используйте wildcard на стороне CORS (осторожно в проде).

## Ограничения

- **Файлы** (`multer`, `server/uploads/`) на Vercel serverless не сохраняются между вызовами — API с загрузками нужен на VPS/PaaS с диском или S3.
- **Долгие соединения** (WebSocket) — не через статический Vercel frontend.
