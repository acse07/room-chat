# Круг — общий чат

Одностраничный чат на React и TypeScript. Вход и регистрация идут через API авторизации, а сообщения доступны только после `AUTH_SUCCESS` от WebSocket.

## Запуск

```sh
npm install
npm run dev
```

## Подключение API

- WebSocket: `wss://inai-col3.fishrungames.com/chat/`
- Вход: `POST https://inai-col3.fishrungames.com/api/token/` (`{ username, password }`, ответ содержит `access`)
- Регистрация сейчас настроена как `POST https://inai-col3.fishrungames.com/api/register/` (`{ username, password }`). Если в актуальном Swagger регистрации назначен другой путь или поля, обновите `src/api.ts`.
- При открытии WebSocket клиент первым отправляет `AUTH` с access токеном. Форма отправки доступна только после `AUTH_SUCCESS`. Сообщения отправляются как `CHAT_MESSAGE`.

## GitHub Pages

Workflow `.github/workflows/deploy.yml` собирает проект при push в `main`. `vite.config.ts` использует базовый путь `/room-chat/`; если репозиторий будет называться иначе, поменяйте его перед публикацией. В настройках репозитория выберите Pages source `GitHub Actions`.
