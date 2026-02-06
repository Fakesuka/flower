import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Check, Star, CreditCard, Banknote, MapPin, User, Percent } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { useAppStore } from '@/store';
import { useTelegram } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';
import type { PaymentMethod, Address, Recipient, Order } from '@/types';

export function CheckoutScreen() {
  const { cart, getCartTotalWithDiscount, navigateTo, addOrder, clearCart, goBack, user } = useAppStore();
  const { hapticImpact, hapticNotification } = useTelegram();
  
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [recipient, setRecipient] = useState<Partial<Recipient>>({ name: '', phone: '' });
  const [address, setAddress] = useState<Partial<Address>>({
    city: '',
    street: '',
    house: '',
    apartment: '',
    entrance: '',
    floor: '',
    comment: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  const { subtotal, discount: cardDiscount, total: subtotalWithCard } = getCartTotalWithDiscount();
  const deliveryCost = subtotalWithCard >= 3000 ? 0 : 500;
  const finalTotal = subtotalWithCard + deliveryCost;

  const discountCard = user?.discountCard;
  const hasApprovedCard = discountCard?.status === 'approved';

  const handleInputChange = (field: string, value: string) => {
    if (field === 'name' || field === 'phone') {
      setRecipient(prev => ({ ...prev, [field]: value }));
    } else {
      setAddress(prev => ({ ...prev, [field]: value }));
    }
  };

  const canSubmit = () => {
    return (
      recipient.name &&
      recipient.phone &&
      address.city &&
      address.street &&
      address.house
    );
  };

  const handleSubmit = () => {
    if (!canSubmit()) return;
    
    hapticImpact('medium');
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      const order: Order = {
        id: `order-${Date.now()}`,
        items: cart,
        status: 'pending',
        total: finalTotal,
        deliveryDate: new Date().toISOString(),
        address: address as Address,
        recipient: recipient as Recipient,
        paymentMethod,
        createdAt: new Date().toISOString(),
        discountCardId: hasApprovedCard ? discountCard?.id : undefined,
        discountAmount: hasApprovedCard ? cardDiscount : undefined,
      };
      
      addOrder(order);
      clearCart();
      hapticNotification('success');
      setIsProcessing(false);
      setStep('success');
    }, 1500);
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 safe-top safe-bottom">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-24 h-24 rounded-full bg-eucalyptus/10 flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-12 h-12 text-eucalyptus" />
          </motion.div>
          <h2 className="font-serif text-2xl text-espresso mb-3">
            Спасибо за заказ!
          </h2>
          <p className="text-warm-gray mb-2">
            Мы свяжемся с вами для подтверждения
          </p>
          <p className="text-espresso font-medium mb-8">
            Номер заказа: #{Date.now().toString().slice(-6)}
          </p>
          {hasApprovedCard && cardDiscount > 0 && (
            <p className="text-eucalyptus text-sm mb-6">
              Скидка по карте: {cardDiscount.toLocaleString('ru-RU')} ₽ ({discountCard?.discountPercent}%)
            </p>
          )}
          <AnimatedButton onClick={() => navigateTo('home')}>
            На главную
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
        <h1 className="font-serif text-xl text-espresso">Оформление заказа</h1>
      </header>

      {/* Discount Card Info */}
      {hasApprovedCard && (
        <section className="px-4 py-2">
          <GlassCard className="p-4 bg-eucalyptus/5 border-eucalyptus/20" animate={false}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-eucalyptus/10 flex items-center justify-center">
                <Percent className="w-5 h-5 text-eucalyptus" />
              </div>
              <div className="flex-1">
                <p className="text-espresso font-medium">Скидка по карте</p>
                <p className="text-eucalyptus text-sm">
                  -{cardDiscount.toLocaleString('ru-RU')} ₽ ({discountCard?.discountPercent}%)
                </p>
              </div>
            </div>
          </GlassCard>
        </section>
      )}

      {/* Recipient */}
      <section className="px-4 py-4">
        <h2 className="font-medium text-espresso mb-3 flex items-center gap-2">
          <User className="w-4 h-4" />
          Получатель
        </h2>
        <GlassCard className="p-4 space-y-4" animate={false}>
          <div>
            <label className="text-sm text-warm-gray mb-1.5 block">Имя</label>
            <input
              type="text"
              placeholder="Имя получателя"
              value={recipient.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="text-sm text-warm-gray mb-1.5 block">Телефон</label>
            <input
              type="tel"
              placeholder="+7 (999) 000-00-00"
              value={recipient.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="input-field w-full"
            />
          </div>
        </GlassCard>
      </section>

      {/* Address */}
      <section className="px-4 py-2">
        <h2 className="font-medium text-espresso mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Адрес доставки
        </h2>
        <GlassCard className="p-4 space-y-4" animate={false}>
          <div>
            <label className="text-sm text-warm-gray mb-1.5 block">Город</label>
            <input
              type="text"
              placeholder="Москва"
              value={address.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="text-sm text-warm-gray mb-1.5 block">Улица</label>
            <input
              type="text"
              placeholder="Название улицы"
              value={address.street}
              onChange={(e) => handleInputChange('street', e.target.value)}
              className="input-field w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-warm-gray mb-1.5 block">Дом</label>
              <input
                type="text"
                placeholder="1"
                value={address.house}
                onChange={(e) => handleInputChange('house', e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="text-sm text-warm-gray mb-1.5 block">Квартира</label>
              <input
                type="text"
                placeholder="10"
                value={address.apartment}
                onChange={(e) => handleInputChange('apartment', e.target.value)}
                className="input-field w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-warm-gray mb-1.5 block">Подъезд</label>
              <input
                type="text"
                placeholder="1"
                value={address.entrance}
                onChange={(e) => handleInputChange('entrance', e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="text-sm text-warm-gray mb-1.5 block">Этаж</label>
              <input
                type="text"
                placeholder="5"
                value={address.floor}
                onChange={(e) => handleInputChange('floor', e.target.value)}
                className="input-field w-full"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-warm-gray mb-1.5 block">Комментарий курьеру</label>
            <textarea
              placeholder="Домофон, код, ориентиры..."
              value={address.comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              className="input-field w-full h-20 resize-none"
            />
          </div>
        </GlassCard>
      </section>

      {/* Payment Method */}
      <section className="px-4 py-2">
        <h2 className="font-medium text-espresso mb-3">Способ оплаты</h2>
        <GlassCard className="p-4 space-y-2" animate={false}>
          <button
            onClick={() => setPaymentMethod('card')}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl transition-colors',
              paymentMethod === 'card' ? 'bg-dusty-rose/10' : 'hover:bg-milk'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              paymentMethod === 'card' ? 'bg-dusty-rose text-white' : 'bg-milk text-espresso'
            )}>
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-espresso">Банковская карта</p>
              <p className="text-xs text-warm-gray">Онлайн оплата</p>
            </div>
            {paymentMethod === 'card' && (
              <Check className="w-5 h-5 text-dusty-rose" />
            )}
          </button>
          
          <button
            onClick={() => setPaymentMethod('stars')}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl transition-colors',
              paymentMethod === 'stars' ? 'bg-dusty-rose/10' : 'hover:bg-milk'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              paymentMethod === 'stars' ? 'bg-dusty-rose text-white' : 'bg-milk text-espresso'
            )}>
              <Star className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-espresso">Telegram Stars</p>
              <p className="text-xs text-warm-gray">Оплата звёздами</p>
            </div>
            {paymentMethod === 'stars' && (
              <Check className="w-5 h-5 text-dusty-rose" />
            )}
          </button>
          
          <button
            onClick={() => setPaymentMethod('cash')}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl transition-colors',
              paymentMethod === 'cash' ? 'bg-dusty-rose/10' : 'hover:bg-milk'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              paymentMethod === 'cash' ? 'bg-dusty-rose text-white' : 'bg-milk text-espresso'
            )}>
              <Banknote className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-espresso">При получении</p>
              <p className="text-xs text-warm-gray">Наличными или картой</p>
            </div>
            {paymentMethod === 'cash' && (
              <Check className="w-5 h-5 text-dusty-rose" />
            )}
          </button>
        </GlassCard>
      </section>

      {/* Order Summary */}
      <section className="px-4 py-4">
        <GlassCard className="p-4" animate={false}>
          <h3 className="font-medium text-espresso mb-3">Ваш заказ</h3>
          <div className="space-y-2 text-sm mb-3">
            <div className="flex justify-between">
              <span className="text-warm-gray">Товары ({cart.length})</span>
              <span>{subtotal.toLocaleString('ru-RU')} ₽</span>
            </div>
            {hasApprovedCard && cardDiscount > 0 && (
              <div className="flex justify-between text-eucalyptus">
                <span className="flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  Скидка по карте
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
          </div>
          <div className="border-t border-milk pt-3">
            <div className="flex justify-between font-semibold text-lg">
              <span>К оплате</span>
              <span>{finalTotal.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Sticky Pay Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-milk px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-40">
        <AnimatedButton
          onClick={handleSubmit}
          disabled={!canSubmit() || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            `Оплатить ${finalTotal.toLocaleString('ru-RU')} ₽`
          )}
        </AnimatedButton>
      </div>
    </div>
  );
}
