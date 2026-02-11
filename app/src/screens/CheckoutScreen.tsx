import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Check, Star, CreditCard, Banknote, MapPin, User, Percent, Store, Package, Truck, Building2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { useApiStore } from '@/store/apiStore';
import { useTelegram } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';
import type { PaymentMethod, Address, Recipient } from '@/types';

const STORE_LOCATIONS = [
  { id: 'cvetochaya_lavka', name: 'Цветочная лавка', address: 'ул. Цветочная, 1' },
  { id: 'florenciya', name: 'Флоренция', address: 'ул. Роз, 15' },
] as const;

export function CheckoutScreen() {
  const { 
    cart, 
    getCartTotalWithDiscount, 
    navigateTo, 
    createOrder, 
    clearCart, 
    goBack, 
    discountCard,
    settings,
    getDeliveryPrice
  } = useApiStore();
  
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
  const [storeLocation, setStoreLocation] = useState<'cvetochaya_lavka' | 'florenciya'>('cvetochaya_lavka');
  const [isOutskirts, setIsOutskirts] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  const { subtotal, discount: cardDiscount, total: subtotalWithCard } = getCartTotalWithDiscount();
  const deliveryCost = getDeliveryPrice(isOutskirts, subtotalWithCard);
  const finalTotal = subtotalWithCard + deliveryCost;

  const hasApprovedCard = discountCard?.status === 'approved';

  // Update city default from settings
  useEffect(() => {
    if (settings && !address.city) {
      setAddress(prev => ({ ...prev, city: 'Москва' }));
    }
  }, [settings]);

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

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    
    hapticImpact('medium');
    setIsProcessing(true);
    
    try {
      const order = await createOrder({
        items: cart,
        total: finalTotal,
        subtotal,
        deliveryCost,
        discountAmount: hasApprovedCard ? cardDiscount : 0,
        discountCardId: hasApprovedCard ? discountCard?.id : undefined,
        deliveryDate: new Date().toISOString(),
        address: address as Address,
        recipient: recipient as Recipient,
        paymentMethod,
        storeLocation,
      });
      
      if (order) {
        setOrderId(order.id);
        await clearCart();
        hapticNotification('success');
        setStep('success');
      }
    } catch (error) {
      console.error('Order creation failed:', error);
    } finally {
      setIsProcessing(false);
    }
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
            Номер заказа: #{orderId.replace('order-', '').slice(-6)}
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

      {/* Store Location Selection */}
      <section className="px-4 py-4">
        <h2 className="font-medium text-espresso mb-3 flex items-center gap-2">
          <Store className="w-4 h-4" />
          Точка самовывоза / Доставки
        </h2>
        <GlassCard className="p-4 space-y-2" animate={false}>
          {STORE_LOCATIONS.map((location) => (
            <button
              key={location.id}
              onClick={() => setStoreLocation(location.id)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left',
                storeLocation === location.id ? 'bg-dusty-rose/10' : 'hover:bg-milk'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                storeLocation === location.id ? 'bg-dusty-rose text-white' : 'bg-milk text-espresso'
              )}>
                <Package className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-espresso">{location.name}</p>
                <p className="text-xs text-warm-gray truncate">{location.address}</p>
              </div>
              {storeLocation === location.id && (
                <Check className="w-5 h-5 text-dusty-rose flex-shrink-0" />
              )}
            </button>
          ))}
        </GlassCard>
        <p className="text-xs text-warm-gray mt-2 px-1">
          Если цветов не будет в наличии на выбранной точке, флорист свяжется с вами
        </p>
      </section>

      {/* Delivery Zone Selection */}
      <section className="px-4 py-2">
        <h2 className="font-medium text-espresso mb-3 flex items-center gap-2">
          <Truck className="w-4 h-4" />
          Зона доставки
        </h2>
        <GlassCard className="p-4 space-y-2" animate={false}>
          <button
            onClick={() => setIsOutskirts(false)}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left',
              !isOutskirts ? 'bg-dusty-rose/10' : 'hover:bg-milk'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
              !isOutskirts ? 'bg-dusty-rose text-white' : 'bg-milk text-espresso'
            )}>
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-espresso">Внутри города</p>
              <p className="text-xs text-warm-gray">
                {subtotalWithCard >= (settings?.freeDeliveryThreshold || 3000) 
                  ? 'Бесплатно' 
                  : `${settings?.deliveryCityPrice || 500} ₽`
                }
              </p>
            </div>
            {!isOutskirts && <Check className="w-5 h-5 text-dusty-rose flex-shrink-0" />}
          </button>
          
          <button
            onClick={() => setIsOutskirts(true)}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left',
              isOutskirts ? 'bg-dusty-rose/10' : 'hover:bg-milk'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
              isOutskirts ? 'bg-dusty-rose text-white' : 'bg-milk text-espresso'
            )}>
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-espresso">За городом</p>
              <p className="text-xs text-warm-gray">
                {subtotalWithCard >= (settings?.freeDeliveryThreshold || 3000) 
                  ? 'Бесплатно' 
                  : `${settings?.deliveryOutskirtsPrice || 800} ₽`
                }
              </p>
            </div>
            {isOutskirts && <Check className="w-5 h-5 text-dusty-rose flex-shrink-0" />}
          </button>
        </GlassCard>
        {subtotalWithCard < (settings?.freeDeliveryThreshold || 3000) && (
          <p className="text-xs text-eucalyptus mt-2 px-1">
            Бесплатная доставка от {(settings?.freeDeliveryThreshold || 3000).toLocaleString('ru-RU')} ₽
          </p>
        )}
      </section>

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
              <span className="text-warm-gray">Доставка ({isOutskirts ? 'за город' : 'по городу'})</span>
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
