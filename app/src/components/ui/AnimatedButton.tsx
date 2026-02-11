import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  disabled = false,
  type = 'button',
}: AnimatedButtonProps) {
  const baseStyles = 'relative font-medium rounded-xl transition-all duration-200 ease-out';
  
  const variants = {
    primary: 'bg-dusty-rose text-white hover:shadow-soft-lg disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'bg-white text-espresso hover:bg-milk shadow-card disabled:opacity-50',
    ghost: 'text-espresso hover:bg-white/50 disabled:opacity-50',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3.5 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </motion.button>
  );
}
