import { motion } from 'framer-motion';
import { ChevronLeft, Package, Truck, CheckCircle, Clock, X, Percent } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { useAppStore } from '@/store';
import { useTelegram } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const statusIcons: Record<OrderStatus, typeof Clock> = {
  pending: Clock,
  accepted: CheckCircle,
  preparing: Package,
  delivering: Truck,
  delivered: CheckCircle,
  cancelled: X,
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
  pending: 'bg-warm-gray/10 text-warm-gray',
  accepted: 'bg-eucalyptus/10 text-eucalyptus',
  preparing: 'bg-dusty-rose/10 text-dusty-rose',
  delivering: 'bg-dusty-rose/10 text-dusty-rose',
  delivered: 'bg-eucalyptus/10 text-eucalyptus',
  cancelled: 'bg-warm-gray/10 text-warm-gray',
};

export function OrdersScreen() {
  const { orders, navigateTo, goBack } = useAppStore();
  const { hapticImpact } = useTelegram();

  const handleReorder = () => {
    hapticImpact('medium');
    navigateTo('catalog');
  };

  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 safe-top safe-bottom">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 rounded-full bg-milk flex items-center justify-center mx-auto mb-6">
            <Package className="w-12 h-12 text-warm-gray" />
          </div>
          <h2 className="font-serif text-2xl text-espresso mb-3">
            Нет заказов
          </h2>
          <p className="text-warm-gray mb-6">
            Сделайте свой первый заказ
          </p>
          <AnimatedButton onClick={() => navigateTo('catalog')}>
            В каталог
          </AnimatedButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-6 safe-top">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-milk/95 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={goBack}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-card"
        >
          <ChevronLeft className="w-5 h-5 text-espresso" />
        </motion.button>
        <h1 className="font-serif text-xl text-espresso">Мои заказы</h1>
      </header>

      {/* Orders List */}
      <section className="px-4 py-4">
        <div className="space-y-4">
          {orders.map((order: Order, index: number) => {
            const StatusIcon = statusIcons[order.status];
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-4" animate={false}>
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium text-espresso text-lg">
                        #{order.id.slice(-6)}
                      </p>
                      <p className="text-warm-gray text-sm">
                        {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className={cn('px-3 py-1.5 rounded-full flex items-center gap-1.5', statusColors[order.status])}>
                      <StatusIcon className="w-4 h-4" />
                      <span className="text-xs font-medium">{statusLabels[order.status]}</span>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Order Details */}
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-warm-gray">Товаров</span>
                      <span>{order.items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warm-gray">Адрес</span>
                      <span className="text-right truncate max-w-[200px]">
                        {order.address.street}, {order.address.house}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warm-gray">Получатель</span>
                      <span>{order.recipient.name}</span>
                    </div>
                    {order.discountAmount && order.discountAmount > 0 && (
                      <div className="flex justify-between text-eucalyptus">
                        <span className="flex items-center gap-1">
                          <Percent className="w-3 h-3" />
                          Скидка по карте
                        </span>
                        <span>-{order.discountAmount.toLocaleString('ru-RU')} ₽</span>
                      </div>
                    )}
                  </div>

                  {/* Total & Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-milk">
                    <div>
                      <p className="text-warm-gray text-sm">Итого</p>
                      <p className="font-semibold text-espresso text-lg">
                        {order.total.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                    {order.status === 'delivered' && (
                      <AnimatedButton
                        onClick={handleReorder}
                        size="sm"
                        variant="secondary"
                      >
                        Повторить
                      </AnimatedButton>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
