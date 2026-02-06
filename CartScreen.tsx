import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Trash2, Tag, Calendar, Clock, ShoppingBag, Percent, CreditCard } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { DiscountCardView } from '@/components/ui/DiscountCardView';
import { useAppStore } from '@/store';
import { useTelegram } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';
import type { CartItem } from '@/types';

export function CartScreen() {
  const { 
    cart, 
    navigateTo, 
    updateQuantity, 
    removeFromCart, 
    getCartTotalWithDiscount, 
    getCartCount,
    goBack,
    user 
  } = useAppStore();
  const { hapticImpact, hapticNotification } = useTelegram();
  
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { subtotal, discount: cardDiscount, total: subtotalWithCard } = getCartTotalWithDiscount();
  const deliveryCost = subtotalWithCard >= 3000 ? 0 : 500;
  const promoDiscount = promoApplied ? Math.round(subtotalWithCard * 0.1) : 0;
  const finalTotal = subtotalWithCard + deliveryCost - promoDiscount;

  const discountCard = user?.discountCard;
  const hasApprovedCard = discountCard?.status === 'approved';

  const handleRemove = (itemId: string) => {
    hapticImpact('light');
    setRemovingId(itemId);
    setTimeout(() => {
      removeFromCart(itemId);
      setRemovingId(null);
    }, 300);
  };

  const handleApplyPromo = () => {
    if (promoCode.toLowerCase() === 'flower10') {
      hapticNotification('success');
      setPromoApplied(true);
    } else {
      hapticNotification('error');
    }
  };

  const handleCheckout = () => {
    hapticImpact('medium');
    navigateTo('checkout');
  };

  const timeSlots = [
    '09:00 - 12:00',
    '12:00 - 15:00',
    '15:00 - 18:00',
    '18:00 - 21:00',
  ];

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 safe-top safe-bottom">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 rounded-full bg-milk flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-warm-gray" />
          </div>
          <h2 className="font-serif text-2xl text-espresso mb-3">
            Корзина пуста
          </h2>
          <p className="text-warm-gray mb-6 max-w-[280px]">
            Добавьте что-нибудь прекрасное — букет или композицию
          </p>
          <AnimatedButton onClick={() => navigateTo('catalog')}>
            Перейти в каталог
          </AnimatedButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-36 safe-top">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-milk/95 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={goBack}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-card"
        >
          <ChevronLeft className="w-5 h-5 text-espresso" />
        </motion.button>
        <div>
          <h1 className="font-serif text-xl text-espresso">Корзина</h1>
          <p className="text-warm-gray text-xs">{getCartCount()} товаров</p>
        </div>
      </header>

      {/* Cart Items */}
      <section className="px-4 py-4">
        <AnimatePresence>
          {cart.map((item: CartItem) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: removingId === item.id ? 0 : 1, 
                x: removingId === item.id ? -100 : 0 
              }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
            >
              <GlassCard className="p-3 mb-3" animate={false}>
                <div className="flex gap-3">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-espresso text-sm line-clamp-1 mb-0.5">
                      {item.product.name}
                    </h3>
                    {item.selectedSize && (
                      <p className="text-warm-gray text-xs">
                        Размер: {item.selectedSize.name}
                      </p>
                    )}
                    {item.selectedColor && (
                      <p className="text-warm-gray text-xs">
                        Палитра: {item.selectedColor.name}
                      </p>
                    )}
                    {item.customMessage && (
                      <p className="text-warm-gray text-xs truncate">
                        "{item.customMessage}"
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <QuantityStepper
                        value={item.quantity}
                        onChange={(qty) => updateQuantity(item.id, qty)}
                      />
                      <span className="font-semibold text-espresso">
                        {((item.product.price + (item.selectedSize?.priceModifier || 0)) * item.quantity).toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  </div>
                  
                  {/* Remove Button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleRemove(item.id)}
                    className="w-8 h-8 rounded-lg bg-milk flex items-center justify-center text-warm-gray hover:text-dusty-rose transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      {/* Discount Card */}
      {hasApprovedCard && discountCard && (
        <section className="px-4 py-2">
          <h2 className="font-medium text-espresso mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Ваша скидка
          </h2>
          <DiscountCardView card={discountCard} compact />
        </section>
      )}

      {/* Delivery Date */}
      <section className="px-4 py-2">
        <h2 className="font-medium text-espresso mb-3">Доставка</h2>
        <GlassCard className="p-4 mb-3" animate={false}>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm text-warm-gray mb-2">
                <Calendar className="w-4 h-4" />
                Дата доставки
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="input-field w-full"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm text-warm-gray mb-2">
                <Clock className="w-4 h-4" />
                Время доставки
              </label>
              <div className="flex flex-wrap gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setDeliveryTime(time)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm transition-colors',
                      deliveryTime === time
                        ? 'bg-dusty-rose text-white'
                        : 'bg-milk text-espresso hover:bg-light-green/20'
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Promo Code */}
      <section className="px-4 py-2">
        <h2 className="font-medium text-espresso mb-3">Промокод</h2>
        <GlassCard className="p-4" animate={false}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />
              <input
                type="text"
                placeholder="Введите код"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                disabled={promoApplied}
                className={cn(
                  'input-field w-full pl-10',
                  promoApplied && 'bg-eucalyptus/10 text-eucalyptus'
                )}
              />
            </div>
            <AnimatedButton
              onClick={handleApplyPromo}
              disabled={!promoCode || promoApplied}
              size="sm"
              variant={promoApplied ? 'secondary' : 'primary'}
            >
              {promoApplied ? 'Применён' : 'Применить'}
            </AnimatedButton>
          </div>
          {promoApplied && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-eucalyptus text-sm mt-2"
            >
              Скидка 10% применена!
            </motion.p>
          )}
        </GlassCard>
      </section>

      {/* Total */}
      <section className="px-4 py-4">
        <GlassCard className="p-4" animate={false}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-warm-gray">Товары</span>
              <span>{subtotal.toLocaleString('ru-RU')} ₽</span>
            </div>
            {hasApprovedCard && cardDiscount > 0 && (
              <div className="flex justify-between text-eucalyptus">
                <span className="flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  Скидка по карте ({discountCard?.discountPercent}%)
                </span>
                <span>-{cardDiscount.toLocaleString('ru-RU')} ₽</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-warm-gray">Доставка</span>
              <span className={deliveryCost === 0 ? 'text-eucalyptus' : ''}>
                {deliveryCost === 0 ? 'Бесплатно' : `${deliveryCost.toLocaleString('ru-RU')} ₽`}
              </span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-eucalyptus">
                <span>Промокод</span>
                <span>-{promoDiscount.toLocaleString('ru-RU')} ₽</span>
              </div>
            )}
            <div className="border-t border-milk pt-2 mt-2">
              <div className="flex justify-between font-semibold text-lg">
                <span>Итого</span>
                <span>{finalTotal.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Sticky Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-milk px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-40">
        <AnimatedButton onClick={handleCheckout} className="w-full">
          Оформить заказ · {finalTotal.toLocaleString('ru-RU')} ₽
        </AnimatedButton>
      </div>
    </div>
  );
}
