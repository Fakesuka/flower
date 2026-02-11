# Backend v1 (Node.js + Express + TypeScript + SQLite)

Новый backend без Telegram auth/bots.

## Что реализовано

- JWT auth (`/api/auth/login`) + bcrypt passwords
- RBAC:
  - `admin`: полный доступ
  - `florist`: заказы, товары, истории (по правилам)
- CRUD по точкам (`/api/stores`) — масштабируемо, не только 2 точки
- CRUD по товарам (`/api/products`) и историям (`/api/stories`) для `admin/florist`
- Заказы с новой моделью:
  - `delivery_type`: `pickup | delivery`
  - `pickup_store_id`
  - `assigned_store_id`
  - статусы: `NEW`, `ACCEPTED`, `NEED_CUSTOMER_CONFIRMATION`, `PAYMENT_LINK_SENT`, `PAID`, `IN_PROGRESS`, `READY`, `OUT_FOR_DELIVERY`, `COMPLETED`, `CANCELED`
- Race accept для delivery: `POST /api/orders/:id/accept` в SQLite транзакции (`BEGIN IMMEDIATE`)
  - второй accept получает `409 Conflict`
- Аудит событий заказа: `order_events` + `POST /api/orders/:id/events`
- Admin stats: `GET /api/admin/stats`

## ENV

Создайте `backend/.env`:

```env
PORT=3001
DB_PATH=data/database.sqlite
JWT_SECRET=change-me
JWT_EXPIRES_IN=1d

# optional bootstrap admin on startup
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin12345
```

## Установка и запуск

```bash
cd backend
npm install
npm run dev
```

Проверка health:

```bash
curl http://localhost:3001/api/health
```

## Миграции

SQL-миграции лежат в `backend/migrations`. 
Применяются автоматически при старте.

Таблица фиксации: `applied_migrations`.

## Как создать admin, 2 stores и 2 florist

### 1) Логин admin

Если задан `DEFAULT_ADMIN_USERNAME/DEFAULT_ADMIN_PASSWORD`, admin создаётся автоматически.

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin12345"}'
```

Скопируйте `token`.

### 2) Создать 2 точки

```bash
curl -X POST http://localhost:3001/api/stores \
  -H "Authorization: Bearer <TOKEN>" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Цветочная лавка","address":"ул. Цветочная, 1"}'

curl -X POST http://localhost:3001/api/stores \
  -H "Authorization: Bearer <TOKEN>" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Флоренция","address":"ул. Роз, 15"}'
```

### 3) Создать 2 florist

```bash
curl -X POST http://localhost:3001/api/users \
  -H "Authorization: Bearer <TOKEN>" \
  -H 'Content-Type: application/json' \
  -d '{"username":"florist1","password":"pass12345","role":"florist","store_id":1}'

curl -X POST http://localhost:3001/api/users \
  -H "Authorization: Bearer <TOKEN>" \
  -H 'Content-Type: application/json' \
  -d '{"username":"florist2","password":"pass12345","role":"florist","store_id":2}'
```

## Тесты

```bash
npm test
```

Покрыто минимально:
- login success/failure
- race accept: второй accept → `409`
