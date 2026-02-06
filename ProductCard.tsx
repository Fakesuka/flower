import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  onFavoriteToggle?: () => void;
  isFavorite?: boolean;
  index?: number;
}

export function ProductCard({
  product,
  onClick,
  onFavoriteToggle,
  isFavorite = false,
  index = 0,
}: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1]
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="product-card cursor-pointer group"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isNew && (
            <span className="px-2.5 py-1 bg-eucalyptus text-white text-[10px] font-semibold rounded-full">
              Новинка
            </span>
          )}
          {product.isBestseller && (
            <span className="px-2.5 py-1 bg-dusty-rose text-white text-[10px] font-semibold rounded-full">
              Хит
            </span>
          )}
        </div>
        
        {/* Favorite Button */}
        {onFavoriteToggle && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle();
            }}
            className={cn(
              'absolute top-3 right-3 w-8 h-8 rounded-full',
              'flex items-center justify-center',
              'bg-white/90 backdrop-blur-sm shadow-card',
              'transition-colors duration-200',
              isFavorite ? 'text-dusty-rose' : 'text-warm-gray hover:text-dusty-rose'
            )}
          >
            <Heart 
              className="w-4 h-4" 
              fill={isFavorite ? 'currentColor' : 'none'}
            />
          </motion.button>
        )}
      </div>
      
      {/* Content */}
      <div className="p-3.5">
        <h3 className="font-medium text-espresso text-sm line-clamp-1 mb-1">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-espresso">
            {product.price.toLocaleString('ru-RU')} ₽
          </span>
          {product.originalPrice && (
            <span className="text-warm-gray text-xs line-through">
              {product.originalPrice.toLocaleString('ru-RU')} ₽
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
