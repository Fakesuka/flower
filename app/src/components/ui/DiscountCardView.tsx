import { motion } from 'framer-motion';
import { CreditCard, Clock, XCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DiscountCard } from '@/types';

interface DiscountCardViewProps {
  card: DiscountCard;
  onRemove?: () => void;
  compact?: boolean;
}

export function DiscountCardView({ card, onRemove, compact = false }: DiscountCardViewProps) {
  const formatCardNumber = (num: string) => {
    return num.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'relative overflow-hidden rounded-2xl p-4',
          card.status === 'approved' 
            ? 'bg-gradient-to-br from-dusty-rose via-soft-pink to-eucalyptus'
            : card.status === 'pending'
            ? 'bg-gradient-to-br from-warm-gray/60 to-warm-gray/40'
            : 'bg-gradient-to-br from-red-400/60 to-red-500/40'
        )}
      >
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white/80 text-xs">Скидочная карта</p>
            <p className="text-white font-mono text-sm tracking-wider">
              {formatCardNumber(card.number)}
            </p>
          </div>
          {card.status === 'approved' && (
            <div className="text-right">
              <p className="text-white font-bold text-xl">{card.discountPercent}%</p>
              <p className="text-white/70 text-[10px]">скидка</p>
            </div>
          )}
        </div>
        
        {/* Decorative circles */}
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-3xl p-6 shadow-xl',
        card.status === 'approved' 
          ? 'bg-gradient-to-br from-dusty-rose via-soft-pink to-eucalyptus'
          : card.status === 'pending'
          ? 'bg-gradient-to-br from-warm-gray/60 to-warm-gray/40'
          : 'bg-gradient-to-br from-red-400/60 to-red-500/40'
      )}
    >
      {/* Card Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" viewBox="0 0 400 250" preserveAspectRatio="none">
          <pattern id="cardPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1.5" fill="white" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#cardPattern)" />
        </svg>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-white/70 text-sm mb-1">Цветочная лавка</p>
            <p className="text-white font-serif text-lg">Скидочная карта</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-2xl">🌸</span>
          </div>
        </div>

        {/* Card Number */}
        <div className="mb-6">
          <p className="text-white/60 text-xs mb-2">Номер карты</p>
          <p className="text-white font-mono text-xl tracking-[0.2em]">
            {formatCardNumber(card.number)}
          </p>
        </div>

        {/* Status & Discount */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/60 text-xs mb-1">Статус</p>
            <div className="flex items-center gap-2">
              {card.status === 'approved' && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span className="text-white text-sm">Активна</span>
                </>
              )}
              {card.status === 'pending' && (
                <>
                  <Clock className="w-4 h-4 text-white" />
                  <span className="text-white text-sm">На проверке</span>
                </>
              )}
              {card.status === 'rejected' && (
                <>
                  <XCircle className="w-4 h-4 text-white" />
                  <span className="text-white text-sm">Отклонена</span>
                </>
              )}
            </div>
          </div>

          {card.status === 'approved' && (
            <div className="text-right">
              <p className="text-white/60 text-xs mb-1">Ваша скидка</p>
              <div className="flex items-baseline gap-1">
                <span className="text-white font-bold text-4xl">{card.discountPercent}</span>
                <span className="text-white text-xl">%</span>
              </div>
            </div>
          )}
        </div>

        {/* Remove button */}
        {onRemove && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onRemove}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <XCircle className="w-4 h-4 text-white" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

interface DiscountCardInputProps {
  onSubmit: (cardNumber: string) => void;
  onCancel: () => void;
}

export function DiscountCardInput({ onSubmit, onCancel }: DiscountCardInputProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    // Validate card number (1-9999)
    const cleanNumber = cardNumber.replace(/\s/g, '');
    const cardNum = parseInt(cleanNumber);
    
    if (isNaN(cardNum) || cardNum < 1 || cardNum > 9999) {
      setError('Введите номер карты от 1 до 9999');
      return;
    }
    onSubmit(cleanNumber);
  };

  const formatInput = (value: string) => {
    const clean = value.replace(/\D/g, '');
    // Limit to 4 digits (max 9999)
    return clean.slice(0, 4);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-warm-gray mb-2 block">
          Номер скидочной карты
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={cardNumber}
          onChange={(e) => {
            setCardNumber(formatInput(e.target.value));
            setError('');
          }}
          placeholder="1 - 9999"
          className="input-field w-full font-mono text-lg tracking-wider"
          maxLength={4}
        />
        {error && (
          <p className="text-dusty-rose text-sm mt-2">{error}</p>
        )}
        <p className="text-warm-gray text-xs mt-2">
          Введите номер вашей карты (от 1 до 9999). После проверки администратором скидка будет активирована.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 px-4 rounded-xl bg-milk text-espresso font-medium hover:bg-warm-gray/20 transition-colors"
        >
          Отмена
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 py-3 px-4 rounded-xl bg-dusty-rose text-white font-medium hover:bg-dusty-rose/90 transition-colors"
        >
          Отправить
        </button>
      </div>
    </div>
  );
}

// Need to import useState for the input component
import { useState } from 'react';
