import TelegramBot from 'node-telegram-bot-api';
import { OrderModel } from '../models/Order';
import { UserModel } from '../models/User';
import { ProductModel } from '../models/Product';

// Florist bot instance
let floristBot: TelegramBot | null = null;

// Florist chat IDs (loaded from environment or database)
const FLORIST_CHAT_IDS: number[] = process.env.FLORIST_CHAT_IDS 
  ? process.env.FLORIST_CHAT_IDS.split(',').map(id => parseInt(id.trim()))
  : [];

// Store locations
const STORE_LOCATIONS: Record<string, string> = {
  cvetochaya_lavka: 'Цветочная лавка',
  florenciya: 'Флоренция'
};

// Initialize florist bot
export function initFloristBot(): TelegramBot | null {
  const token = process.env.FLORIST_BOT_TOKEN;
  
  if (!token) {
    console.log('⚠️ FLORIST_BOT_TOKEN not set, florist bot will not be available');
    return null;
  }

  try {
    floristBot = new TelegramBot(token, { polling: true });
    
    console.log('🤖 Florist bot initialized');
    
    // Handle /start command
    floristBot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      await floristBot!.sendMessage(
        chatId,
        '👋 Добро пожаловать в бот для флористов Цветочной лавки!\n\n' +
        'Здесь вы будете получать уведомления о новых заказах.\n\n' +
        `Ваш Chat ID: ${chatId}\n` +
        'Сообщите его администратору для подключения к системе.'
      );
    });

    // Handle callback queries (buttons)
    floristBot.on('callback_query', async (query) => {
      const chatId = query.message?.chat.id;
      const data = query.data;
      
      if (!chatId || !data) return;

      try {
        // Parse callback data: action:orderId
        const [action, orderId] = data.split(':');
        
        if (!orderId) return;

        const order = await OrderModel.getById(orderId);
        if (!order) {
          await floristBot!.sendMessage(chatId, '❌ Заказ не найден');
          return;
        }

        const user = await UserModel.getById(order.user_id);

        switch (action) {
          case 'accept':
            await handleAcceptOrder(orderId, chatId, user);
            break;
          case 'contact':
            await handleContactCustomer(orderId, chatId, user);
            break;
          case 'unavailable':
            await handleUnavailableItems(orderId, chatId, user);
            break;
          case 'status_preparing':
            await handleStatusUpdate(orderId, 'preparing', chatId);
            break;
          case 'status_delivering':
            await handleStatusUpdate(orderId, 'delivering', chatId);
            break;
          case 'status_delivered':
            await handleStatusUpdate(orderId, 'delivered', chatId);
            break;
        }

        // Answer callback to remove loading state
        await floristBot!.answerCallbackQuery(query.id);
      } catch (error) {
        console.error('Florist bot callback error:', error);
        await floristBot!.sendMessage(chatId, '❌ Произошла ошибка');
      }
    });

    return floristBot;
  } catch (error) {
    console.error('Failed to initialize florist bot:', error);
    return null;
  }
}

// Send new order notification to florists
export async function notifyFloristsAboutOrder(orderId: string): Promise<void> {
  if (!floristBot || FLORIST_CHAT_IDS.length === 0) {
    console.log('Florist bot not available or no florist chat IDs configured');
    return;
  }

  try {
    const order = await OrderModel.getById(orderId);
    if (!order) return;

    const user = await UserModel.getById(order.user_id);
    const items = JSON.parse(order.items);
    const address = JSON.parse(order.address);
    const recipient = JSON.parse(order.recipient);

    // Get product images for the order
    const productImages: string[] = [];
    for (const item of items) {
      const product = await ProductModel.getById(item.productId);
      if (product?.image) {
        productImages.push(product.image);
      }
    }

    const storeName = STORE_LOCATIONS[order.store_location] || 'Цветочная лавка';
    const location = address.city || address.street 
      ? `${address.city || ''}, ${address.street || ''} ${address.house || ''}`.trim()
      : 'Самовывоз';

    const message = 
      '🌸 *НОВЫЙ ЗАКАЗ* 🌸\n\n' +
      `📍 *Точка:* ${storeName}\n` +
      `🆔 *Заказ:* #${orderId.replace('order-', '')}\n` +
      `💰 *Сумма:* ${order.total} ₽\n` +
      `📅 *Дата доставки:* ${order.delivery_date || 'Не указана'}\n` +
      `⏰ *Время:* ${order.delivery_time || 'Не указано'}\n\n` +
      `👤 *Клиент:* ${user?.first_name || ''} ${user?.last_name || ''}\n` +
      `📱 *Телефон:* ${user?.phone || 'Не указан'}\n` +
      `📍 *Адрес:* ${location}\n\n` +
      `🎁 *Получатель:* ${recipient.name || 'Не указан'}\n` +
      `📞 *Телефон получателя:* ${recipient.phone || 'Не указан'}\n\n` +
      `📦 *Товары (${items.length}):*\n` +
      items.map((item: any, idx: number) => 
        `${idx + 1}. ${item.name} - ${item.quantity} шт. × ${item.price} ₽`
      ).join('\n') + '\n\n' +
      (order.discount_amount > 0 ? `💳 *Скидка:* ${order.discount_amount} ₽\n` : '') +
      `💵 *Итого:* ${order.total} ₽`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Принять заказ', callback_data: `accept:${orderId}` },
          { text: '📞 Связаться с клиентом', callback_data: `contact:${orderId}` }
        ],
        [
          { text: '❌ Нет в наличии', callback_data: `unavailable:${orderId}` }
        ]
      ]
    };

    // Send to all florists
    for (const chatId of FLORIST_CHAT_IDS) {
      try {
        // Send photos if available
        if (productImages.length > 0) {
          const media = productImages.slice(0, 10).map((img, idx) => ({
            type: 'photo' as const,
            media: img,
            caption: idx === 0 ? `Фото заказа #${orderId.replace('order-', '')}` : undefined
          }));
          
          await floristBot.sendMediaGroup(chatId, media);
        }

        // Send order details with buttons
        await floristBot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });

        // Mark order as notified
        await OrderModel.updateFloristNotified(orderId, true);
      } catch (error) {
        console.error(`Failed to notify florist ${chatId}:`, error);
      }
    }
  } catch (error) {
    console.error('Notify florists error:', error);
  }
}

// Handle order acceptance
async function handleAcceptOrder(orderId: string, chatId: number, user: any): Promise<void> {
  if (!floristBot) return;

  try {
    // Update order status
    await OrderModel.updateStatus(orderId, 'accepted');
    await OrderModel.updateFloristChatId(orderId, chatId.toString());

    // Send confirmation to florist
    await floristBot.sendMessage(
      chatId,
      `✅ Заказ #${orderId.replace('order-', '')} принят!\n\n` +
      'Теперь вы можете обновлять статус заказа:',
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔧 На сборке', callback_data: `status_preparing:${orderId}` },
              { text: '🚚 В доставке', callback_data: `status_delivering:${orderId}` }
            ],
            [
              { text: '✅ Доставлен', callback_data: `status_delivered:${orderId}` }
            ]
          ]
        }
      }
    );

    // Send payment notification to customer
    await sendPaymentNotificationToCustomer(orderId, user);

  } catch (error) {
    console.error('Handle accept order error:', error);
    await floristBot.sendMessage(chatId, '❌ Ошибка при принятии заказа');
  }
}

// Handle contact customer request
async function handleContactCustomer(orderId: string, chatId: number, user: any): Promise<void> {
  if (!floristBot) return;

  const customerPhone = user?.phone || 'не указан';
  const customerName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Клиент';
  const telegramUsername = user?.username ? `@${user.username}` : 'не указан';

  await floristBot.sendMessage(
    chatId,
    `📞 *Контакты клиента для заказа #${orderId.replace('order-', '')}*\n\n` +
    `👤 *Имя:* ${customerName}\n` +
    `📱 *Телефон:* ${customerPhone}\n` +
    `💬 *Telegram:* ${telegramUsername}\n\n` +
    'Вы можете связаться с клиентом для уточнения деталей заказа.',
    { parse_mode: 'Markdown' }
  );
}

// Handle unavailable items
async function handleUnavailableItems(orderId: string, chatId: number, user: any): Promise<void> {
  if (!floristBot) return;

  const customerPhone = user?.phone || 'не указан';
  const customerName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Клиент';

  await floristBot.sendMessage(
    chatId,
    `❌ *Нет в наличии - Заказ #${orderId.replace('order-', '')}*\n\n` +
    `👤 *Клиент:* ${customerName}\n` +
    `📱 *Телефон:* ${customerPhone}\n\n` +
    'Свяжитесь с клиентом для обсуждения замены или отмены заказа.',
    { parse_mode: 'Markdown' }
  );
}

// Handle status update
async function handleStatusUpdate(orderId: string, status: string, chatId: number): Promise<void> {
  if (!floristBot) return;

  try {
    await OrderModel.updateStatus(orderId, status as any);

    const statusMessages: Record<string, string> = {
      preparing: '🔧 Заказ на сборке',
      delivering: '🚚 Заказ в доставке',
      delivered: '✅ Заказ доставлен'
    };

    await floristBot.sendMessage(
      chatId,
      `${statusMessages[status]} #${orderId.replace('order-', '')}`
    );

    // Send notification to customer
    await sendStatusNotificationToCustomer(orderId, status);

  } catch (error) {
    console.error('Handle status update error:', error);
    await floristBot.sendMessage(chatId, '❌ Ошибка при обновлении статуса');
  }
}

// Send payment notification to customer
async function sendPaymentNotificationToCustomer(orderId: string, user: any): Promise<void> {
  // This will be implemented in the customer bot
  const { notifyCustomerAboutPayment } = require('./customerBot');
  await notifyCustomerAboutPayment(orderId, user?.telegram_id);
}

// Send status notification to customer
async function sendStatusNotificationToCustomer(orderId: string, status: string): Promise<void> {
  const { notifyCustomerAboutStatus } = require('./customerBot');
  const order = await OrderModel.getById(orderId);
  if (order) {
    const user = await UserModel.getById(order.user_id);
    if (user) {
      await notifyCustomerAboutStatus(orderId, status, user.telegram_id);
    }
  }
}

// Get florist bot instance
export function getFloristBot(): TelegramBot | null {
  return floristBot;
}
