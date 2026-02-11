# Цветочная Лавка - Release Preparation

## Что реализовано

### Backend

1. **Express.js сервер** с TypeScript
2. **SQLite база данных** со следующими таблицами:
   - `users` - пользователи Telegram
   - `products` - каталог товаров
   - `categories` - категории товаров
   - `orders` - заказы с полным трекингом
   - `discount_cards` - скидочные карты
   - `settings` - настройки магазина
   - `admins` - администраторы
   - `favorites` - избранное
   - `cart_items` - корзина

3. **Двойная система ботов**:
   - **Customer Bot** - отправляет уведомления клиентам
   - **Florist Bot** - получает заказы и управляет ими

4. **API Endpoints**:
   - `/api/products` - управление товарами
   - `/api/orders` - управление заказами
   - `/api/discount-cards` - скидочные карты
   - `/api/settings` - настройки магазина
   - `/api/admins` - управление администраторами

### Frontend

1. **React + TypeScript + Vite**
2. **Telegram WebApp интеграция**
3. **Адаптивный дизайн** с pastel watercolor темой
4. **Экраны**:
   - Главная (Home)
   - Каталог (Catalog)
   - Карточка товара (Product)
   - Конструктор букета (Builder)
   - Корзина (Cart)
   - Оформление заказа (Checkout)
   - Профиль (Profile)
   - Заказы (Orders)
   - Админ-панель (Admin)

### Особенности

1. **Две точки магазина**:
   - Цветочная лавка
   - Флоренция

2. **Гибкая система доставки**:
   - Цена по городу (настраивается)
   - Цена за городом (настраивается)
   - Бесплатная доставка от суммы (настраивается)

3. **Скидочные карты**:
   - Номера от 1 до 9999
   - Требуют одобрения администратора
   - Процент скидки настраивается

4. **Сезонные темы**:
   - Зима, Весна, Лето, Осень
   - Меняются в админ-панели

5. **Уведомления**:
   - Заказ принят → оплата
   - Букет на сборке
   - Букет в доставке
   - Букет доставлен + ссылки на отзывы

## Подготовка к запуску

### 1. Создание ботов в Telegram

1. Напишите [@BotFather](https://t.me/BotFather)
2. Создайте два бота:
   - `/newbot` - Customer Bot (для клиентов)
   - `/newbot` - Florist Bot (для флористов)
3. Скопируйте токены

### 2. Настройка окружения

```bash
cd backend
cp .env.example .env
```

Отредактируйте `.env`:
```env
CUSTOMER_BOT_TOKEN=your_customer_bot_token
FLORIST_BOT_TOKEN=your_florist_bot_token
FLORIST_CHAT_IDS=          # заполнится позже
PAYMENT_URL=https://your-payment-url.com
YANDEX_MAPS_URL=https://yandex.ru/maps/your-shop
TWOGIS_URL=https://2gis.ru/your-shop
```

### 3. Получение Chat ID флористов

1. Запустите backend: `npm run dev`
2. Флористы пишут `/start` Florist Bot
3. Бот ответит с их Chat ID
4. Добавьте ID в `FLORIST_CHAT_IDS` через запятую

### 4. Добавление первого администратора

Вставьте в базу данных (через SQLite CLI или API):
```sql
INSERT INTO admins (telegram_id, name, role) VALUES ('YOUR_TELEGRAM_ID', 'Admin Name', 'admin');
```

### 5. Запуск

```bash
# Установка зависимостей
npm run install:all

# Разработка
npm run dev

# Продакшн
npm run build
npm start
```

## Проверка перед релизом

### Backend
- [ ] Все API endpoints работают
- [ ] Боты получают и отправляют сообщения
- [ ] База данных создаётся корректно
- [ ] Аутентификация работает
- [ ] CORS настроен правильно

### Frontend
- [ ] Все экраны открываются
- [ ] Корзина работает
- [ ] Оформление заказа проходит
- [ ] Админ-панель доступна только админам
- [ ] Сезонные темы меняются

### Интеграция
- [ ] Telegram WebApp открывается
- [ ] initData передаётся корректно
- [ ] Haptic feedback работает
- [ ] Back button работает

## Деплой

### Требования
- Node.js 18+
- SQLite 3
- PM2 (для продакшна)

### Процесс деплоя

```bash
# 1. Клонирование
git clone <repo>
cd cvetochaya-lavka

# 2. Установка
npm run install:all

# 3. Сборка
npm run build

# 4. Настройка окружения
# Отредактируйте backend/.env

# 5. Запуск с PM2
cd backend
pm2 start dist/index.js --name "cvetochaya-lavka"
pm2 save
pm2 startup
```

## Поддержка

### Логи
```bash
# Backend logs
cd backend
pm2 logs

# или
tail -f data/database.sqlite
```

### Резервное копирование
```bash
# База данных
cp backend/data/database.sqlite backup-$(date +%Y%m%d).sqlite
```

### Обновление
```bash
# 1. Стоп
cd backend
pm2 stop cvetochaya-lavka

# 2. Обновление
git pull
npm run install:all
npm run build

# 3. Старт
pm2 start cvetochaya-lavka
```

## Чеклист релиза

- [ ] Созданы боты в @BotFather
- [ ] Получены все токены
- [ ] Настроен .env
- [ ] Добавлены флористы в FLORIST_CHAT_IDS
- [ ] Добавлен первый администратор
- [ ] Настроены цены доставки
- [ ] Выбрана сезонная тема
- [ ] Добавлены товары в каталог
- [ ] Добавлены истории
- [ ] Проведено тестирование заказа
- [ ] Проверены уведомления в ботах
- [ ] Настроен payment URL
- [ ] Добавлены ссылки на отзывы (Яндекс, 2GIS)
- [ ] Сервер настроен и запущен
- [ ] WebApp URL настроен в @BotFather
