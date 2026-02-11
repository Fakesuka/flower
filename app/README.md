# Frontend (React + Vite + PWA)

## Что добавлено

- PWA (manifest + service worker via `vite-plugin-pwa`)
- 3 зоны в одном приложении:
  - `/` — клиентская PWA
  - `/florist` — панель флориста
  - `/admin` — панель админа
- `react-router-dom` маршрутизация + guards
- Staff login: `/login` (JWT)
- Install banner (кнопка установки PWA)

## Новые страницы / роуты

- `/` — каталог + stories
- `/checkout` — оформление (pickup/delivery, name/phone/comment)
- `/order/:id` — статус заказа (ожидает подтверждения, отображение payment link при появлении)
- `/login` — вход персонала
- `/florist` — заказы + действия + базовые разделы products/stories
- `/admin` — users florists CRUD + stats table/chart

## Dev run

```bash
cd app
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Переменные окружения

```env
VITE_API_URL=http://localhost:3001/api
```
