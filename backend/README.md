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
- Платежная архитектура через провайдер:
  - интерфейс провайдера (`src_v1/payments/provider.ts`)
  - `MockPaymentProvider` (dev)
  - `POST /api/orders/:id/create-payment-link`
  - `GET /pay/mock/:paymentId` + кнопка Pay
  - webhook-контракт `POST /api/payments/webhook/:provider`
- Аудит событий заказа: `order_events` + события `PAYMENT_LINK_CREATED`, `PAYMENT_PAID`
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

## Локальный тест оплаты (mock)

1. Создайте заказ `NEW`:
```bash
curl -X POST http://localhost:3001/api/orders \
  -H 'Content-Type: application/json' \
  -d '{"delivery_type":"delivery","customer_name":"Test","customer_phone":"+79990000000","items":[{"product_id":1,"qty":1,"price":1000,"name":"Rose"}],"total_price":1000}'
```

2. Флорист принимает заказ:
```bash
curl -X POST http://localhost:3001/api/orders/<ORDER_ID>/accept \
  -H "Authorization: Bearer <FLORIST_TOKEN>" \
  -H 'Content-Type: application/json' \
  -d '{}'
```

3. Формирует ссылку на оплату:
```bash
curl -X POST http://localhost:3001/api/orders/<ORDER_ID>/create-payment-link \
  -H "Authorization: Bearer <FLORIST_TOKEN>" \
  -H 'Content-Type: application/json' \
  -d '{}'
```

4. Откройте `payment_url` в браузере и нажмите **Pay**.
5. Проверьте статус:
```bash
curl http://localhost:3001/api/orders/<ORDER_ID>/status
```

Должен стать `PAID`.

## Тесты

```bash
npm test
```

Покрыто минимально:
- login success/failure
- race accept: второй accept → `409`
- create payment link -> ok
- mock pay -> order becomes `PAID`
- second pay -> `409`
