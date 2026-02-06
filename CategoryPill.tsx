import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Heart, 
  Cake, 
  Sparkles, 
  Flower2, 
  Calendar,
  Sprout,
  Gift,
  Circle,
  Mail,
  Shovel,
  Candy,
  Apple,
  LayoutGrid,
  type LucideIcon
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Heart,
  Cake,
  Sparkles,
  Flower2,
  Calendar,
  Sprout,
  Gift,
  Circle,
  Mail,
  Shovel,
  Candy,
  Apple,
  LayoutGrid,
};

interface CategoryPillProps {
  id: string;
  name: string;
  icon?: string;
  isActive?: boolean;
  onClick?: () => void;
  index?: number;
}

export function CategoryPill({
  name,
  icon,
  isActive = false,
  onClick,
  index = 0,
}: CategoryPillProps) {
  const IconComponent = icon ? iconMap[icon] : null;

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1] as const
      }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'category-pill flex items-center gap-2',
        isActive && 'active'
      )}
    >
      {IconComponent && (
        <IconComponent className={cn(
          'w-4 h-4 transition-colors',
          isActive ? 'text-white' : 'text-warm-gray'
        )} />
      )}
      <span>{name}</span>
    </motion.button>
  );
}
