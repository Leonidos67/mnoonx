# Как вернуть ленту постов на главной

Главная временно показывает экран «ведутся работы» вместо ленты. Управление — флаг в `client/src/pages/Home.tsx`.

## Включить ленту снова

1. Открой файл:

```
client/src/pages/Home.tsx
```

2. Найди константу (рядом с импортами):

```ts
const HOME_FEED_UNDER_MAINTENANCE = true;
```

3. Поставь `false`:

```ts
const HOME_FEED_UNDER_MAINTENANCE = false;
```

4. Сохрани файл. При `npm start` клиент подхватит изменение сам; иначе перезапусти `client`.

После этого снова появятся:

- композер постов;
- рекомендации сообществ;
- лента постов;
- правая панель деталей поста (при выборе поста).

## Что делает флаг

| `HOME_FEED_UNDER_MAINTENANCE` | Поведение |
|-------------------------------|-----------|
| `true` | Лента и композер скрыты; в центре — текст + видео `/edit-video.mp4`; запрос постов не выполняется |
| `false` | Обычная главная с лентой |

Видео лежит в `client/public/edit-video.mp4` (URL в приложении: `/edit-video.mp4`).

Тексты экрана: ключи `home.feedMaintenanceTitle` и `home.feedMaintenanceBody` в `client/src/i18n/messages/en.ts` и `ru.ts`.
