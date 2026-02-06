import { motion } from 'framer-motion';
import { Home, Grid3X3, ShoppingBag, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Screen } from '@/types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  cartCount?: number;
}

const navItems: { id: Screen; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Главная', icon: Home },
  { id: 'catalog', label: 'Каталог', icon: Grid3X3 },
  { id: 'cart', label: 'Корзина', icon: ShoppingBag },
  { id: 'profile', label: 'Профиль', icon: User },
];

export function BottomNav({ currentScreen, onNavigate, cartCount = 0 }: BottomNavProps) {
  return (
    <nav className="bottom-nav z-50">
      {navItems.map((item) => {
        const isActive = currentScreen === item.id;
        const Icon = item.icon;
        
        return (
          <motion.button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'flex flex-col items-center justify-center py-2 px-4 relative',
              'transition-colors duration-200',
              isActive ? 'text-dusty-rose' : 'text-warm-gray'
            )}
          >
            <div className="relative">
              <Icon 
                className={cn(
                  'w-5 h-5 transition-all duration-200',
                  isActive && 'scale-110'
                )} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              
              {/* Cart Badge */}
              {item.id === 'cart' && cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    'absolute -top-2 -right-2 min-w-[18px] h-[18px]',
                    'bg-dusty-rose text-white text-[10px] font-semibold',
                    'rounded-full flex items-center justify-center px-1'
                  )}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </motion.span>
              )}
            </div>
            
            <span className={cn(
              'text-[11px] mt-1 font-medium',
              isActive ? 'text-dusty-rose' : 'text-warm-gray'
            )}>
              {item.label}
            </span>
            
            {/* Active Indicator */}
            {isActive && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-dusty-rose"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </nav>
  );
}
