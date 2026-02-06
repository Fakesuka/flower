import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  className,
}: QuantityStepperProps) {
  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleDecrease}
        disabled={value <= min}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          'bg-milk text-espresso transition-colors',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'active:bg-light-green/30'
        )}
      >
        <Minus className="w-4 h-4" />
      </motion.button>
      
      <span className="w-8 text-center font-medium text-espresso">
        {value}
      </span>
      
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleIncrease}
        disabled={value >= max}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          'bg-milk text-espresso transition-colors',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'active:bg-light-green/30'
        )}
      >
        <Plus className="w-4 h-4" />
      </motion.button>
    </div>
  );
}
