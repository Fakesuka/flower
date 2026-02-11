import TelegramBot from 'node-telegram-bot-api';
import { OrderModel } from '../models/Order';

// Customer bot instance
let customerBot: TelegramBot | null = null;

// Review links
const REVIEW_LINKS = {
  yandex: process.env.YANDEX_MAPS_URL || 'https://yandex.ru/maps/org/cvetochnaya_lavka',
  twogis: process.env.TWOGIS_URL || 'https://2gis.ru/firm/cvetochnaya_lavka'
};

// Initialize customer bot
export function initCustomerBot(): TelegramBot | null {
  const token = process.env.CUSTOMER_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.log('⚠️ CUSTOMER_BOT_TOKEN not set, customer bot will not be available');
    return null;
  }

  try {
    customerBot = new TelegramBot(token, { polling: false });
    console.log('🤖 Customer bot initialized (notification mode)');
    return customerBot;
  } catch (error) {
    console.error('Failed to initialize customer bot:', error);
    return null;
  }
}

// Notify customer about order acceptance and payment
export async function notifyCustomerAboutPayment(orderId: string, telegramId?: string): Promise<void> {
  if (!customerBot || !telegramId) {
    console.log('Customer bot not available or no telegram ID');
    return;
  }

  try {
    const order = await OrderModel.getById(orderId);
    if (!order) return;

    const paymentUrl = order.payment_url || process.env.PAYMENT_URL || 'https://payment.example.com';

    const message = 
      '🎉 *Ваш заказ принят!* 🎉\n\n' +
      `🆔 *Заказ:* #${orderId.replace('order-', '')}\n` +
      `💰 *Сумма к оплате:* ${order.total} ₽\n\n` +
      'Нажмите кнопку ниже для оплаты:';

    const keyboard = {
      inline_keyboard: [
        [
          { text: '💳 Оплатить заказ', url: paymentUrl }
        ]
      ]
    };

    await customerBot.sendMessage(telegramId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

    // Mark as notified
    await OrderModel.updateCustomerNotified(orderId, true);

  } catch (error) {
    console.error('Notify customer about payment error:', error);
  }
}

// Notify customer about status update
export async function notifyCustomerAboutStatus(
  orderId: string, 
  status: string, 
  telegramId?: string
): Promise<void> {
  if (!customerBot || !telegramId) {
    console.log('Customer bot not available or no telegram ID');
    return;
  }

  try {
    const statusMessages: Record<string, { text: string; emoji: string }> = {
      accepted: { text: 'Ваш заказ принят!', emoji: '✅' },
      preparing: { text: 'Ваш букет собирается!', emoji: '🔧' },
      delivering: { text: 'Ваш букет в пути!', emoji: '🚚' },
      delivered: { text: 'Ваш букет доставлен!', emoji: '🎉' }
    };

    const statusInfo = statusMessages[status];
    if (!statusInfo) return;

    let message = `${statusInfo.emoji} *${statusInfo.text}* ${statusInfo.emoji}\n\n`;
    message += `🆔 *Заказ:* #${orderId.replace('order-', '')}\n\n`;

    // Add review buttons for delivered status
    if (status === 'delivered') {
      message += 'Спасибо за заказ! 💐\n\n';
      message += 'Будем благодарны за ваш отзыв:';

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🌟 Отзыв на Яндекс Картах', url: REVIEW_LINKS.yandex }
          ],
          [
            { text: '🌟 Отзыв на 2GIS', url: REVIEW_LINKS.twogis }
          ]
        ]
      };

      await customerBot.sendMessage(telegramId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } else {
      await customerBot.sendMessage(telegramId, message, {
        parse_mode: 'Markdown'
      });
    }

  } catch (error) {
    console.error('Notify customer about status error:', error);
  }
}

// Send custom notification to customer
export async function sendCustomNotification(
  telegramId: string, 
  message: string,
  options?: TelegramBot.SendMessageOptions
): Promise<void> {
  if (!customerBot) {
    console.log('Customer bot not available');
    return;
  }

  try {
    await customerBot.sendMessage(telegramId, message, {
      parse_mode: 'Markdown',
      ...options
    });
  } catch (error) {
    console.error('Send custom notification error:', error);
  }
}

// Get customer bot instance
export function getCustomerBot(): TelegramBot | null {
  return customerBot;
}
