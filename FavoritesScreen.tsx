import { motion } from 'framer-motion';
import { ChevronLeft, Heart } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { ProductCard } from '@/components/ui/ProductCard';
import { products } from '@/data';
import { useAppStore } from '@/store';
import { useTelegram } from '@/hooks/useTelegram';

export function FavoritesScreen() {
  const { user, navigateTo, setSelectedProduct, addToFavorites, removeFromFavorites, goBack } = useAppStore();
  const { hapticImpact } = useTelegram();

  const favoriteProducts = products.filter(p => user?.favorites.includes(p.id));

  const handleProductClick = (product: typeof products[0]) => {
    hapticImpact('light');
    setSelectedProduct(product);
    navigateTo('product');
  };

  const handleFavoriteToggle = (productId: string) => {
    hapticImpact('light');
    if (user?.favorites.includes(productId)) {
      removeFromFavorites(productId);
    } else {
      addToFavorites(productId);
    }
  };

  if (favoriteProducts.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 safe-top safe-bottom">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 rounded-full bg-milk flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-warm-gray" />
          </div>
          <h2 className="font-serif text-2xl text-espresso mb-3">
            Нет избранного
          </h2>
          <p className="text-warm-gray mb-6">
            Добавляйте букеты в избранное, чтобы не потерять
          </p>
          <AnimatedButton onClick={() => navigateTo('catalog')}>
            В каталог
          </AnimatedButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-6 safe-top">
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
          <h1 className="font-serif text-xl text-espresso">Избранное</h1>
          <p className="text-warm-gray text-xs">{favoriteProducts.length} товаров</p>
        </div>
      </header>

      {/* Products Grid */}
      <section className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          {favoriteProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onClick={() => handleProductClick(product)}
              onFavoriteToggle={() => handleFavoriteToggle(product.id)}
              isFavorite={true}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
