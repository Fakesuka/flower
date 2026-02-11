# Architecture Audit: Telegram WebApp → PWA + florist/admin transition

> Scope: audit-only. No refactoring in this change.

## Project scan

### Repository structure (high-level)

```text
.
├── app/                         # Frontend (React + Vite + TS)
│   ├── src/
│   │   ├── components/ui/       # UI-kit + app UI components
│   │   ├── hooks/               # useTelegram, use-mobile
│   │   ├── screens/             # App screens (home/catalog/cart/checkout/admin/...)
│   │   ├── services/            # HTTP client (api.ts)
│   │   ├── store/               # Zustand stores (local + API-integrated)
│   │   ├── types/               # Shared frontend types
│   │   ├── App.tsx              # screen-switch router orchestration
│   │   └── main.tsx             # frontend entrypoint
│   └── ...
├── backend/
│   ├── src/
│   │   ├── bots/                # Telegram florist/customer bots
│   │   ├── database/            # SQLite bootstrap + schema init
│   │   ├── middleware/          # Telegram auth middleware
│   │   ├── models/              # Data access layer
│   │   ├── routes/              # REST routes
│   │   └── index.ts             # backend entrypoint
│   └── ...
├── README.md
├── RELEASE.md
└── package.json
```

### Entrypoints, routing, state, UI, API client

- **Frontend entrypoint:** `app/src/main.tsx` renders `<App />`.
- **Frontend routing model:** no React Router; screen state is manual (`currentScreen`) in Zustand and switched via map in `app/src/App.tsx`.
- **State management:**
  - `app/src/store/apiStore.ts` is the main runtime store (persisted Zustand + async API sync).
  - `app/src/store/index.ts` is a legacy/local-only store still present but not primary in `App.tsx`.
- **UI composition:** screen-per-feature (`app/src/screens/*`) + reusable components (`app/src/components/ui/*`).
- **API client:** centralized in `app/src/services/api.ts` (`apiFetch`) with `X-Telegram-Auth` header from Telegram WebApp initData.

### Backend scan summary

- **Backend entrypoint:** `backend/src/index.ts`.
- **Route modules:**
  - `products.ts`, `categories.ts`, `stories.ts`
  - `cart.ts`, `favorites.ts`, `orders.ts`
  - `users.ts`, `discountCards.ts`, `settings.ts`, `admins.ts`
- **Middleware:** `backend/src/middleware/auth.ts` with Telegram initData hash verification + user autoload.
- **Data layer:** models in `backend/src/models/*.ts`.
- **DB schema:** created imperatively on startup in `backend/src/database/db.ts` (`CREATE TABLE IF NOT EXISTS ...`).
- **Migrations:** explicit migration framework is **absent**.
- **Telegram bot integration:**
  - `backend/src/bots/floristBot.ts`
  - `backend/src/bots/customerBot.ts`
  - bot init is called on server startup in `backend/src/index.ts`.

### Current route inventory

- `GET /api/health`, `GET /api/me` (debug)
- Products:
  - `GET /api/products`
  - `GET /api/products/:id`
  - `GET /api/products/category/:categoryId`
  - `GET /api/products/bestsellers/all`
  - `GET /api/products/new/all`
  - `GET /api/products/search?q=`
  - `POST/PUT/DELETE /api/products...` (declared as admin-only but protected only by `requireAuth`)
- Categories:
  - `GET /api/categories`
  - `POST /api/categories`
  - `PUT /api/categories/:id`
  - `DELETE /api/categories/:id`
- Stories:
  - `GET /api/stories`, `GET /api/stories/:id`
  - `POST/PUT/DELETE /api/stories...`
- Orders:
  - `GET /api/orders/my`
  - `GET /api/orders/:id`
  - `POST /api/orders`
  - `POST /api/orders/:id/cancel`
  - `GET /api/orders` (admin aggregate)
  - `PUT /api/orders/:id/status`
- Discount cards:
  - `GET /api/discount-cards/my`
  - `POST /api/discount-cards/request`
  - `DELETE /api/discount-cards/my`
  - `GET /api/discount-cards/pending`
  - `GET /api/discount-cards`
  - `POST /api/discount-cards/:id/approve`
  - `POST /api/discount-cards/:id/reject`
- Favorites:
  - `GET /api/favorites`
  - `POST /api/favorites/:productId`
  - `DELETE /api/favorites/:productId`
  - `GET /api/favorites/:productId/check`
- Cart:
  - `GET /api/cart/my`
  - `POST /api/cart`
  - `PUT /api/cart/:itemId`
  - `DELETE /api/cart/:itemId`
  - `DELETE /api/cart/my`
  - `POST /api/cart/sync`
- Users:
  - `GET /api/users/me`
  - `PUT /api/users/me`
  - `PUT /api/users/phone`
  - `GET /api/users/addresses`
  - `POST /api/users/addresses`
  - `DELETE /api/users/addresses/:addressId`
- Settings:
  - `GET /api/settings`
  - `GET /api/settings/:key`
  - `PUT /api/settings`
  - `PUT /api/settings/:key`
- Admins:
  - `GET /api/admins/check`
  - `GET /api/admins`
  - `POST /api/admins`
  - `PUT /api/admins/:telegramId/role`
  - `DELETE /api/admins/:telegramId`

---

## Current Architecture

### 1) Domain behavior (products/cart/orders/stories)

#### Products

- Read-model from SQLite `products` table via `ProductModel`.
- Public listing/search endpoints are available with optional auth.
- Product attributes include serialized JSON fields (`images`, `sizes`, `colors`, `composition`) but no typed schema enforcement at DB level.

#### Cart

- Cart is dual-mode:
  - local persistent cart in Zustand (`apiStore` with `persist`), and
  - server cart in `cart_items` table.
- `apiStore` updates local state first and attempts server sync optimistically.
- Server cart endpoints currently use `verifyTelegramAuth` and depend on `req.userId` population, but `verifyTelegramAuth` by itself does not load user from DB, so behavior is fragile/inconsistent.

#### Orders

- Checkout screen sends payload to `createOrder` in `apiStore`, which calls `POST /api/orders`.
- Backend order record contains:
  - serialized `items`, `address`, `recipient`
  - `store_location`
  - `payment_status` + `payment_url`
  - florist/customer notification flags.
- After create, backend immediately triggers florist Telegram notifications (`notifyFloristsAboutOrder`).
- Admin/florist status changes are done via `PUT /api/orders/:id/status` with coarse statuses.

#### Stories

- Simple CRUD over `stories` table with public read and auth-gated write.

### 2) Where and how order is created now

1. User fills checkout form in `CheckoutScreen`.
2. Frontend sends `items`, totals, recipient/address, payment method, store location via `api.orders.create`.
3. Backend `orders` route validates minimal fields and writes order with status `pending` and payment status `pending`.
4. Backend invokes florist bot notification flow.
5. On florist “accept” callback in bot:
   - status becomes `accepted`
   - assigned florist chat id is stored
   - customer bot sends payment notification with payment URL.

### 3) Current authentication and Telegram coupling

#### Frontend coupling

- `useTelegram` directly initializes Telegram WebApp API (`window.Telegram.WebApp`).
- API client always tries to send `X-Telegram-Auth` from `initData`.
- App UX uses Telegram-only features (BackButton/MainButton/Haptics/closing confirmation/header color).

#### Backend coupling

- Core auth middleware validates Telegram initData signature using bot token and HMAC (`verifyTelegramAuth`).
- `loadUser` creates/loads user by `telegram_id`.
- `requireAuth` = Telegram verification + user loading.
- DB user identity key is `telegram_id`.
- Admin model/route identity also keyed by `telegram_id`.
- Two Telegram bots (florist + customer) are part of operational order lifecycle (acceptance/status/payment notifications).

#### Critical gaps found during audit

- Route/middleware mismatch (`verifyTelegramAuth` used where `req.userId` is required) can break cart/users flows.
- Some endpoints intended as admin-only are guarded only by `requireAuth`, not `requireAdmin`.
- In `admins/check` route there is inconsistent request field usage (`req.user?.telegramId` vs declared `telegram_id`).
- Frontend API path mismatch for favorites (`/favorites/my` in client vs `/favorites` in backend).
- No migration mechanism for evolving schema toward PWA+RBAC requirements.

---

## Target Architecture

### 1) Target business model for new requirements

#### Catalog and stores

- Keep **one shared catalog** (`products`, `categories`, `stories`) visible to all customer channels.
- Introduce **store points = 2** (`cvetochaya_lavka`, `florenciya`) as first-class entities.

#### Order routing

- **Pickup:** customer chooses point; order is assigned to that store on creation.
- **Delivery:** order created as `unassigned`; both stores see it in queue; first accepted assignment wins atomically.

#### Customer communication & exceptions

- Persist customer contact (`phone`) as required checkout field.
- Add order event log / chat log timeline for operations.
- Add operational statuses:
  - `NEED_CONFIRMATION`
  - `OUT_OF_STOCK`
  - `WAITING_CUSTOMER`
- Florist/admin can add messages/events visible in panel and optionally visible to customer in PWA.

#### Payment-after-accept flow

1. Order created in draft/pending confirmation state.
2. Florist accepts order.
3. Backend generates payment link and stores payment session.
4. Customer pays by link.
5. Backend confirms via payment callback/polling and marks order `PAID`.
6. Only `PAID` orders can move to preparation/fulfillment.

### 2) Suggested RBAC

Roles:

- `CUSTOMER`
  - manage own profile/addresses/cart/favorites
  - create/view own orders
  - pay own orders
- `FLORIST`
  - view assigned store queue + unassigned delivery queue
  - accept/reject/assign orders
  - update lifecycle statuses and communication events
- `ADMIN`
  - all florist capabilities
  - user/role/store management
  - catalog/settings management
  - audit/override actions

Permission scopes:

- `store:*` (store-local operations)
- `orders:assign:any` (cross-store delivery pickup)
- `catalog:write`
- `settings:write`
- `rbac:write`

### 3) Proposed API (PWA + florist/admin panels)

Auth/session (Telegram-independent):

- `POST /auth/register` (phone/email + password or OTP bootstrap)
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

Catalog/public:

- `GET /catalog/products`
- `GET /catalog/products/:id`
- `GET /catalog/categories`
- `GET /catalog/stories`

Customer:

- `GET/PUT /me`
- `GET/POST/DELETE /me/addresses`
- `GET/POST/PUT/DELETE /me/cart`
- `GET/POST/DELETE /me/favorites`
- `GET /me/orders`
- `POST /orders` (create: pickup/delivery intent)
- `GET /orders/:id` (owner or privileged)

Order operations:

- `GET /ops/orders?scope=store|unassigned_delivery`
- `POST /ops/orders/:id/accept`
- `POST /ops/orders/:id/reject`
- `POST /ops/orders/:id/assign` (admin/dispatch)
- `POST /ops/orders/:id/status`
- `POST /ops/orders/:id/events` (chat log / timeline)
- `GET /ops/orders/:id/events`

Payments:

- `POST /payments/orders/:id/create-link` (after accept)
- `POST /payments/webhook`
- `GET /payments/orders/:id/status`

RBAC/admin:

- `GET/POST /admin/users`
- `PUT /admin/users/:id/role`
- `GET/POST /admin/stores`
- `GET/PUT /admin/settings`
- `GET/POST/PUT/DELETE /admin/catalog/products`

### 4) Step-by-step implementation plan (no code yet)

1. **ADR + contract freeze**: finalize state machine, statuses, ownership, payment transitions.
2. **Auth strategy decision**: JWT session + refresh (or external IdP) and migration path from Telegram users.
3. **DB redesign + migrations**: add tables (`stores`, `order_assignments`, `order_events`, `payment_sessions`, RBAC tables), preserve backward compatibility.
4. **Backend auth replacement**: add `/auth/*`, remove Telegram initData dependency in middleware.
5. **RBAC enforcement**: introduce centralized permission checks and replace weak route guards.
6. **Order workflow v2**: implement pickup vs unassigned delivery assignment with atomic accept.
7. **Payment integration**: create-link on accept, webhook confirmation, transition to `PAID`.
8. **Frontend decoupling from Telegram**: feature-flag `useTelegram`, add browser/PWA navigation/session UX.
9. **New florist/admin panels**: queue views, event log, status controls, assignment actions.
10. **Cutover & cleanup**: deprecate bots/auth path, migrate users/orders, remove legacy endpoints/hooks.

### 5) Risk list

- **Data migration risk:** telegram-based identity conversion to platform identity.
- **Race conditions:** two stores accepting same delivery order; requires transactional locking.
- **Payment consistency:** webhook delays/retries causing duplicate state transitions.
- **Authorization regressions:** currently loose guards suggest latent privilege escalation paths.
- **Frontend coupling debt:** Telegram UI assumptions can leak into PWA UX if not isolated early.
- **Operational continuity:** bots currently embedded in flow; need temporary bridge mode during migration.

---

## Files likely to change in implementation phase (with reason)

### Frontend

- `app/src/hooks/useTelegram.ts` — isolate/disable Telegram-only APIs for browser/PWA mode.
- `app/src/App.tsx` — replace screen-state routing with robust app routing/auth guards.
- `app/src/services/api.ts` — switch auth header scheme, endpoint namespaces, typed DTOs.
- `app/src/store/apiStore.ts` — new auth/session/order workflow states, assignment/payment statuses.
- `app/src/screens/CheckoutScreen.tsx` — enforce contact capture + payment-after-accept UX.
- `app/src/screens/AdminScreen.tsx` — split into florist/admin role-specific panels and actions.
- `app/src/screens/OrdersScreen.tsx` — show new statuses/events/payment state.
- `app/src/types/index.ts` — expand order/payment/status/RBAC/store models.

### Backend

- `backend/src/middleware/auth.ts` — remove Telegram initData verification, add JWT/session middleware.
- `backend/src/index.ts` — register new auth/ops/payment routes, decouple bot startup from core flow.
- `backend/src/database/db.ts` — stop runtime ad-hoc schema; move to migration-driven setup.
- `backend/src/routes/orders.ts` — new state machine, assignment, payment gating.
- `backend/src/routes/admins.ts` + new RBAC routes — role/permission management.
- `backend/src/routes/users.ts` — non-Telegram identity and profile management.
- `backend/src/models/*.ts` — align with normalized schema and new entities.
- `backend/src/bots/*.ts` — optional transitional adapters only, no core responsibility.

### New backend modules expected

- `backend/src/routes/auth.ts`
- `backend/src/routes/payments.ts`
- `backend/src/routes/opsOrders.ts`
- `backend/src/models/Store.ts`, `OrderEvent.ts`, `PaymentSession.ts`, `Role.ts`, `Permission.ts`
- `backend/migrations/*`

---

## MVP recommendation (first delivery slice)

1. **Auth+RBAC foundation** (JWT + roles + protected routes).
2. **Order v2 minimal flow**:
   - create order with `pickup|delivery`
   - unassigned delivery queue
   - florist accept action with atomic assignment
3. **Payment-after-accept**:
   - generate link on accept
   - webhook updates `payment_status=PAID`
4. **Basic florist panel**:
   - queue list
   - accept/status update
   - contact notes/events
5. **PWA customer checkout update**:
   - mandatory phone
   - waiting-for-accept screen
   - pay-by-link step

This MVP removes Telegram auth dependency from critical path while preserving core business operations for both stores.
