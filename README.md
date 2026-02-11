# 🌸 Цветочная лавка (Flower Shop) - Telegram WebApp

Полнофункциональное приложение для цветочного магазина внутри Telegram WebApp с бэкендом на Node.js и SQLite базой данных.

## ✨ Функционал

### Для покупателей:
- 🏠 **Главная страница** с историями (Stories) и популярными товарами
- 📦 **Каталог** товаров с фильтрами по категориям
- 🔍 **Поиск** товаров
- 🛒 **Корзина** с расчетом скидок
- 🏗️ **Конструктор букетов** - собери свой уникальный букет
- 👤 **Профиль** с историей заказов и избранным
- 💳 **Скидочные карты** - добавь карту и получи скидку
- 📱 **Instagram-истории** - просматривай акции и новинки

### Для администратора:
- 📊 **Панель управления** товарами
- 📝 **Управление историями** (Stories)
- 💳 **Управление скидочными картами** - одобрение/отклонение
- 📦 **Управление заказами** - изменение статусов

## 🛠️ Технологии

### Frontend:
- React + TypeScript
- Vite
- Tailwind CSS
- Framer Motion (анимации)
- Zustand (state management)
- Telegram WebApp SDK

### Backend:
- Node.js + Express
- TypeScript
- SQLite (better-sqlite3)
- Telegram Bot API (для валидации auth)

## 📁 Структура проекта

```
/mnt/okcomputer/output/
├── app/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # React компоненты
│   │   ├── screens/        # Экраны приложения
│   │   ├── store/          # Zustand store
│   │   ├── services/       # API сервисы
│   │   ├── hooks/          # React hooks
│   │   ├── types/          # TypeScript types
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                # Backend (Express + SQLite)
│   ├── src/
│   │   ├── database/       # База данных
│   │   ├── models/         # Модели данных
│   │   ├── routes/         # API роуты
│   │   ├── middleware/     # Middleware (auth)
│   │   └── index.ts        # Точка входа
│   ├── package.json
│   └── .env.example
│
└── README.md
```

## 🚀 Запуск проекта

### 1. Настройка бэкенда

```bash
cd backend

# Установка зависимостей
npm install

# Создание .env файла
cp .env.example .env

# Редактирование .env
BOT_TOKEN=your_telegram_bot_token
PORT=3001
NODE_ENV=development

# Запуск в режиме разработки
npm run dev

# Или сборка и запуск
npm run build
npm start
```

### 2. Настройка фронтенда

```bash
cd app

# Установка зависимостей
npm install

# Создание .env файла
cp .env.example .env

# Редактирование .env
VITE_API_URL=http://localhost:3001/api

# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build
```

### 3. Настройка Telegram Bot

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен бота
3. Создайте WebApp через BotFather:
   - `/newapp` или `/mybots` → YourBot → Bot Settings → Menu Button → Configure menu button
   - Укажите URL вашего приложения
4. Добавьте токен в `.env` бэкенда

## 🔐 Аутентификация

Приложение использует стандартную аутентификацию Telegram WebApp:

1. Telegram отправляет `initData` при открытии WebApp
2. Бэкенд проверяет HMAC-SHA256 подпись
3. Пользователь создается в БД при первом входе
4. Все последующие запросы авторизуются через `X-Telegram-Auth` заголовок

## 📊 API Endpoints

### Products
- `GET /api/products` - Список товаров
- `GET /api/products/:id` - Детали товара
- `GET /api/products/category/:categoryId` - Товары по категории
- `GET /api/products/bestsellers/all` - Хиты продаж
- `GET /api/products/new/all` - Новинки
- `GET /api/products/search?q=query` - Поиск
- `POST /api/products` - Создать товар (admin)
- `PUT /api/products/:id` - Обновить товар (admin)
- `DELETE /api/products/:id` - Удалить товар (admin)

### Stories
- `GET /api/stories` - Список историй
- `POST /api/stories` - Создать историю (admin)
- `DELETE /api/stories/:id` - Удалить историю (admin)

### Categories
- `GET /api/categories` - Список категорий

### Discount Cards
- `GET /api/discount-cards/my` - Моя скидочная карта
- `POST /api/discount-cards/request` - Запросить карту
- `DELETE /api/discount-cards/my` - Удалить карту
- `GET /api/discount-cards/pending` - Ожидающие карты (admin)
- `POST /api/discount-cards/:id/approve` - Одобрить карту (admin)
- `POST /api/discount-cards/:id/reject` - Отклонить карту (admin)

### Orders
- `GET /api/orders/my` - Мои заказы
- `POST /api/orders` - Создать заказ
- `POST /api/orders/:id/cancel` - Отменить заказ
- `GET /api/orders` - Все заказы (admin)
- `PUT /api/orders/:id/status` - Обновить статус (admin)

### Favorites
- `GET /api/favorites/my` - Мое избранное
- `POST /api/favorites` - Добавить в избранное
- `DELETE /api/favorites/:productId` - Удалить из избранного

### Cart
- `GET /api/cart/my` - Моя корзина
- `POST /api/cart` - Добавить в корзину
- `PUT /api/cart/:itemId` - Обновить элемент
- `DELETE /api/cart/:itemId` - Удалить элемент
- `DELETE /api/cart/my` - Очистить корзину

### User
- `GET /api/users/me` - Информация о пользователе
- `PUT /api/users/me` - Обновить профиль
- `PUT /api/users/phone` - Обновить телефон

## 🎨 Дизайн

Приложение использует пастельную цветовую палитру:

- **Milk** `#F6F7F4` - Основной фон
- **Dusty Rose** `#D98F9A` - Акцентный цвет (кнопки, ссылки)
- **Eucalyptus** `#6F8F7A` - Вторичный акцент
- **Charcoal** `#4A4A4A` - Основной текст
- **Stone** `#8B8680` - Вторичный текст

## 📱 Telegram WebApp Features

- **Haptic Feedback** - Виброотклик на действия
- **Back Button** - Нативная кнопка назад
- **Main Button** - Нативная основная кнопка
- **Closing Confirmation** - Подтверждение закрытия на важных экранах
- **Viewport** - Адаптация под размеры WebApp

## 📝 Лицензия

MIT License

## 👨‍💻 Автор

Created with ❤️ for Цветочная лавка
