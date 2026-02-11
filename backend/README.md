# Цветочная Лавка - Backend

Backend for the "Цветочная Лавка" (Flower Shop) Telegram WebApp.

## Features

- **Express.js** REST API with TypeScript
- **SQLite** database for data persistence
- **Telegram WebApp** authentication validation
- **Dual Bot System**:
  - Customer Bot - sends notifications to customers
  - Florist Bot - receives orders and manages them
- **Order Management** with status tracking
- **Discount Card System** with admin approval
- **Multi-location Support** (Цветочная лавка & Флоренция)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3001) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `CUSTOMER_BOT_TOKEN` | Telegram bot token for customer notifications | Yes |
| `FLORIST_BOT_TOKEN` | Telegram bot token for florist notifications | Yes |
| `FLORIST_CHAT_IDS` | Comma-separated list of florist Telegram chat IDs | Yes |
| `PAYMENT_URL` | URL for payment processing | Yes |
| `YANDEX_MAPS_URL` | Link to Yandex Maps review page | Yes |
| `TWOGIS_URL` | Link to 2GIS review page | Yes |

## Telegram Bot Setup

### Creating Bots

1. Talk to [@BotFather](https://t.me/BotFather) on Telegram
2. Create two bots:
   - Customer bot (for sending notifications)
   - Florist bot (for receiving orders)
3. Copy the bot tokens to your `.env` file

### Getting Florist Chat IDs

1. Start the florist bot
2. Florists send `/start` to the bot
3. The bot will reply with their Chat ID
4. Add these IDs to `FLORIST_CHAT_IDS` in `.env`

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `GET /api/products/category/:categoryId` - Get by category
- `GET /api/products/search?q=query` - Search products

### Orders
- `GET /api/orders/my` - Get user's orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/:id/cancel` - Cancel order

### Discount Cards
- `GET /api/discount-cards/my` - Get user's card
- `POST /api/discount-cards/request` - Request new card
- `DELETE /api/discount-cards/my` - Remove card

### Admin Endpoints
- `GET /api/orders` - Get all orders
- `PUT /api/orders/:id/status` - Update order status
- `GET /api/discount-cards/pending` - Get pending cards
- `POST /api/discount-cards/:id/approve` - Approve card
- `POST /api/discount-cards/:id/reject` - Reject card

## Order Flow

1. **Customer creates order** → Order saved with status `pending`
2. **Florists notified** → All florists receive order details
3. **Florist accepts order** → Status changes to `accepted`
4. **Customer receives payment notification**
5. **Florist updates status**:
   - `preparing` - Bouquet being assembled
   - `delivering` - Out for delivery
   - `delivered` - Delivered + review links sent

## Store Locations

Two store locations are supported:

- `cvetochaya_lavka` - Цветочная лавка
- `florenciya` - Флоренция

Customers select location during checkout. If flowers are unavailable at the selected location, florists can contact the customer to arrange alternatives.

## Database Schema

The SQLite database includes tables for:
- `users` - Telegram user information
- `products` - Product catalog
- `categories` - Product categories
- `orders` - Order details with status tracking
- `discount_cards` - Discount card requests
- `favorites` - User favorites
- `cart_items` - Persistent cart

## License

MIT
