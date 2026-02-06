import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  animate?: boolean;
  delay?: number;
}

export function GlassCard({ 
  children, 
  className, 
  onClick, 
  animate = true,
  delay = 0 
}: GlassCardProps) {
  if (!animate) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'bg-white/80 backdrop-blur-xl rounded-2xl',
          'border border-white/60',
          'shadow-soft',
          onClick && 'active:scale-[0.98] transition-transform duration-200',
          className
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: [0.22, 1, 0.36, 1] as const
      }}
      onClick={onClick}
      className={cn(
        'bg-white/80 backdrop-blur-xl rounded-2xl',
        'border border-white/60',
        'shadow-soft',
        onClick && 'active:scale-[0.98] transition-transform duration-200',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
