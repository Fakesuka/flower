import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  MapPin, 
  Heart, 
  Bell, 
  HelpCircle, 
  Info, 
  ChevronRight,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Settings,
  CreditCard,
  Plus
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { DiscountCardView, DiscountCardInput } from '@/components/ui/DiscountCardView';
import { useApiStore } from '@/store/apiStore';
import { useTelegram } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';
import type { Order, Screen, OrderStatus } from '@/types';

const menuItems: { id: Screen; label: string; icon: typeof ShoppingBag }[] = [
  { id: 'orders', label: 'Мои заказы', icon: ShoppingBag },
  { id: 'addresses', label: 'Адреса доставки', icon: MapPin },
  { id: 'favorites', label: 'Избранное', icon: Heart },
];

const settingsItems = [
  { id: 'notifications', label: 'Уведомления', icon: Bell },
  { id: 'help', label: 'Помощь', icon: HelpCircle },
  { id: 'about', label: 'О магазине', icon: Info },
];

const statusIcons: Record<OrderStatus, typeof Clock> = {
  pending: Clock,
  accepted: CheckCircle,
  preparing: Package,
  delivering: Truck,
  delivered: CheckCircle,
  cancelled: Clock,
};

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Ожидает подтверждения',
  accepted: 'Принят',
  preparing: 'В работе',
  delivering: 'В пути',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

const statusColors: Record<OrderStatus, string> = {
  pending: 'text-warm-gray',
  accepted: 'text-eucalyptus',
  preparing: 'text-dusty-rose',
  delivering: 'text-dusty-rose',
  delivered: 'text-eucalyptus',
  cancelled: 'text-warm-gray',
};

export function ProfileScreen() {
  const { navigateTo, user, orders, requestDiscountCard, removeDiscountCard, discountCard } = useApiStore();
  const { hapticImpact, hapticNotification } = useTelegram();
  const [showCardInput, setShowCardInput] = useState(false);

  const handleNavigate = (screen: Screen) => {
    hapticImpact('light');
    navigateTo(screen);
  };

  const handleCardSubmit = async (cardNumber: string) => {
    hapticImpact('medium');
    try {
      await requestDiscountCard(cardNumber);
      setShowCardInput(false);
      hapticNotification('success');
    } catch (error) {
      hapticNotification('error');
    }
  };

  const handleRemoveCard = async () => {
    hapticImpact('light');
    try {
      await removeDiscountCard();
      hapticNotification('success');
    } catch (error) {
      hapticNotification('error');
    }
  };

  const recentOrders = orders.slice(0, 3);

  return (
    <div className="min-h-screen pb-24 safe-top">
      {/* Header */}
      <header className="px-4 py-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-dusty-rose/10 flex items-center justify-center">
            <span className="text-2xl">🌸</span>
          </div>
          <div className="flex-1">
            <h1 className="font-serif text-xl text-espresso">
              {user?.name || 'Гость'}
            </h1>
            <p className="text-warm-gray text-sm">
              {user?.phone || 'Войдите через Telegram'}
            </p>
          </div>
          {/* Admin Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNavigate('admin')}
            className="w-10 h-10 rounded-full bg-eucalyptus/10 flex items-center justify-center"
          >
            <Settings className="w-5 h-5 text-eucalyptus" />
          </motion.button>
        </div>
      </header>

      {/* Stats */}
      <section className="px-4 py-2">
        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="p-4 text-center" animate={false}>
            <p className="font-serif text-2xl text-dusty-rose mb-1">
              {orders.length}
            </p>
            <p className="text-xs text-warm-gray">Заказов</p>
          </GlassCard>
          <GlassCard className="p-4 text-center" animate={false}>
            <p className="font-serif text-2xl text-eucalyptus mb-1">
              {user?.favorites.length || 0}
            </p>
            <p className="text-xs text-warm-gray">В избранном</p>
          </GlassCard>
          <GlassCard className="p-4 text-center" animate={false}>
            <p className="font-serif text-2xl text-soft-pink mb-1">
              {user?.addresses.length || 0}
            </p>
            <p className="text-xs text-warm-gray">Адресов</p>
          </GlassCard>
        </div>
      </section>

      {/* Discount Card Section */}
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-espresso flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Скидочная карта
          </h2>
          {!discountCard && !showCardInput && (
            <button 
              onClick={() => setShowCardInput(true)}
              className="text-dusty-rose text-sm font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Добавить
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {showCardInput ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <GlassCard className="p-4" animate={false}>
                <DiscountCardInput
                  onSubmit={handleCardSubmit}
                  onCancel={() => setShowCardInput(false)}
                />
              </GlassCard>
            </motion.div>
          ) : discountCard ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <DiscountCardView 
                card={discountCard} 
                onRemove={handleRemoveCard}
              />
              {discountCard.status === 'pending' && (
                <p className="text-warm-gray text-sm mt-3 text-center">
                  Карта на проверке. Скидка будет активирована после одобрения администратором.
                </p>
              )}
              {discountCard.status === 'rejected' && (
                <p className="text-dusty-rose text-sm mt-3 text-center">
                  Карта отклонена. Проверьте правильность номера или свяжитесь с нами.
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 rounded-full bg-milk flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-8 h-8 text-warm-gray" />
              </div>
              <p className="text-warm-gray text-sm mb-1">У вас нет скидочной карты</p>
              <p className="text-warm-gray text-xs">Добавьте карту, чтобы получать скидки</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <section className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-espresso">Последние заказы</h2>
            <button 
              onClick={() => handleNavigate('orders')}
              className="text-dusty-rose text-sm font-medium"
            >
              Все
            </button>
          </div>
          
          <div className="space-y-3">
            {recentOrders.map((order: Order, index: number) => {
              const StatusIcon = statusIcons[order.status];
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlassCard className="p-4" animate={false}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-espresso">
                          #{order.id.slice(-6)}
                        </span>
                        <span className="text-warm-gray text-sm">
                          {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <div className={cn('flex items-center gap-1', statusColors[order.status])}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-xs">{statusLabels[order.status]}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-warm-gray text-sm">
                        {order.items.length} товаров
                      </p>
                      <p className="font-semibold text-espresso">
                        {order.total.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Menu */}
      <section className="px-4 py-4">
        <h2 className="font-medium text-espresso mb-3">Меню</h2>
        <GlassCard className="overflow-hidden" animate={false}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-4 transition-colors hover:bg-milk/50',
                  index !== menuItems.length - 1 && 'border-b border-milk'
                )}
              >
                <div className="w-10 h-10 rounded-full bg-dusty-rose/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-dusty-rose" />
                </div>
                <span className="flex-1 text-left font-medium text-espresso">
                  {item.label}
                </span>
                <ChevronRight className="w-5 h-5 text-warm-gray" />
              </motion.button>
            );
          })}
        </GlassCard>
      </section>

      {/* Settings */}
      <section className="px-4 py-4">
        <h2 className="font-medium text-espresso mb-3">Настройки</h2>
        <GlassCard className="overflow-hidden" animate={false}>
          {settingsItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  'w-full flex items-center gap-3 p-4 transition-colors hover:bg-milk/50',
                  index !== settingsItems.length - 1 && 'border-b border-milk'
                )}
              >
                <div className="w-10 h-10 rounded-full bg-light-green/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-eucalyptus" />
                </div>
                <span className="flex-1 text-left font-medium text-espresso">
                  {item.label}
                </span>
                <ChevronRight className="w-5 h-5 text-warm-gray" />
              </motion.button>
            );
          })}
        </GlassCard>
      </section>

      {/* Admin Section */}
      <section className="px-4 py-4">
        <h2 className="font-medium text-espresso mb-3">Управление</h2>
        <GlassCard className="overflow-hidden" animate={false}>
          <motion.button
            whileTap={{ scale: 0.99 }}
            onClick={() => handleNavigate('admin')}
            className="w-full flex items-center gap-3 p-4 transition-colors hover:bg-milk/50"
          >
            <div className="w-10 h-10 rounded-full bg-eucalyptus/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-eucalyptus" />
            </div>
            <span className="flex-1 text-left font-medium text-espresso">
              Админ-панель
            </span>
            <ChevronRight className="w-5 h-5 text-warm-gray" />
          </motion.button>
        </GlassCard>
      </section>

      {/* About Shop */}
      <section className="px-4 py-4">
        <GlassCard className="p-4 text-center" animate={false}>
          <p className="font-serif text-lg text-espresso mb-1">Цветочная лавка</p>
          <p className="text-warm-gray text-sm mb-3">
            Свежие цветы с быстрой доставкой
          </p>
          <div className="flex justify-center gap-4 text-xs text-warm-gray">
            <span>📞 +7 (999) 000-00-00</span>
            <span>📍 Москва</span>
          </div>
        </GlassCard>
      </section>

      {/* Version */}
      <section className="px-4 py-4 text-center">
        <p className="text-warm-gray text-xs">Версия 1.0.0</p>
      </section>
    </div>
  );
}
