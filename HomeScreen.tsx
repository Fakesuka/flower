import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { CategoryPill } from '@/components/ui/CategoryPill';
import { ProductCard } from '@/components/ui/ProductCard';
import { Stories } from '@/components/ui/Stories';
import { categories, products, stories } from '@/data';
import { useAppStore } from '@/store';
import { useTelegram } from '@/hooks/useTelegram';

export function HomeScreen() {
  const { navigateTo, setSelectedProduct, selectedCategory, setSelectedCategory, user } = useAppStore();
  const { hapticImpact, hapticSelection } = useTelegram();

  const bestsellers = products.filter(p => p.isBestseller).slice(0, 4);
  const newArrivals = products.filter(p => p.isNew).slice(0, 4);

  const handleCategoryClick = (categoryId: string) => {
    hapticSelection();
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    navigateTo('catalog');
  };

  const handleProductClick = (product: typeof products[0]) => {
    hapticImpact('light');
    setSelectedProduct(product);
    navigateTo('product');
  };

  const handleBuilderClick = () => {
    hapticImpact('medium');
    navigateTo('builder');
  };

  const handleCatalogClick = () => {
    hapticImpact('light');
    navigateTo('catalog');
  };

  return (
    <div className="min-h-screen pb-24 safe-top">
      {/* Hero Section */}
      <section className="relative h-[42vh] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&h=1000&fit=crop"
            alt="Flower bouquet"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-milk" />
        </div>

        {/* Hero Content */}
        <div className="relative h-full flex flex-col justify-end p-5 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-dusty-rose" />
              <span className="text-white/90 text-sm font-medium">Цветочная лавка</span>
            </div>
            <h1 className="font-serif text-3xl text-white mb-2 leading-tight">
              Букеты, которые<br />говорят за вас
            </h1>
            <p className="text-white/80 text-sm mb-5 max-w-[280px]">
              Свежие цветы с быстрой доставкой. Соберите свой идеальный букет.
            </p>
            
            <div className="flex gap-3">
              <AnimatedButton 
                onClick={handleBuilderClick}
                size="md"
                className="shadow-lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Собрать букет
              </AnimatedButton>
              <AnimatedButton 
                variant="secondary"
                onClick={handleCatalogClick}
                size="md"
              >
                Каталог
                <ArrowRight className="w-4 h-4 ml-2" />
              </AnimatedButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stories */}
      <section className="py-4">
        <Stories stories={stories} />
      </section>

      {/* Categories */}
      <section className="px-4 py-4">
        <h2 className="font-serif text-xl text-espresso mb-4">Категории</h2>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4">
          {categories.map((category, index) => (
            <CategoryPill
              key={category.id}
              {...category}
              index={index}
              onClick={() => handleCategoryClick(category.id)}
            />
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="px-4 py-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl text-espresso">Популярное</h2>
          <button 
            onClick={handleCatalogClick}
            className="text-dusty-rose text-sm font-medium flex items-center gap-1"
          >
            Все
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {bestsellers.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onClick={() => handleProductClick(product)}
              isFavorite={user?.favorites.includes(product.id)}
            />
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl text-espresso">Новинки</h2>
          <button 
            onClick={handleCatalogClick}
            className="text-dusty-rose text-sm font-medium flex items-center gap-1"
          >
            Все
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {newArrivals.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onClick={() => handleProductClick(product)}
              isFavorite={user?.favorites.includes(product.id)}
            />
          ))}
        </div>
      </section>

      {/* Builder CTA */}
      <section className="px-4 py-4">
        <GlassCard className="p-5 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-serif text-lg text-espresso mb-2">
              Соберите свой букет
            </h3>
            <p className="text-warm-gray text-sm mb-4">
              Выберите цветы, стиль и упаковку — мы соберём идеальный букет
            </p>
            <AnimatedButton onClick={handleBuilderClick} size="sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Начать сборку
            </AnimatedButton>
          </div>
          <div className="absolute right-0 top-0 w-32 h-full opacity-20">
            <img
              src="https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=200&h=300&fit=crop"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        </GlassCard>
      </section>

      {/* Delivery Info */}
      <section className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="p-4 text-center" animate={false}>
            <div className="w-10 h-10 rounded-full bg-dusty-rose/10 flex items-center justify-center mx-auto mb-2">
              <span className="text-dusty-rose text-lg">🚚</span>
            </div>
            <p className="text-xs text-warm-gray">Быстрая доставка</p>
          </GlassCard>
          <GlassCard className="p-4 text-center" animate={false}>
            <div className="w-10 h-10 rounded-full bg-eucalyptus/10 flex items-center justify-center mx-auto mb-2">
              <span className="text-eucalyptus text-lg">🌸</span>
            </div>
            <p className="text-xs text-warm-gray">Свежие цветы</p>
          </GlassCard>
          <GlassCard className="p-4 text-center" animate={false}>
            <div className="w-10 h-10 rounded-full bg-soft-pink/30 flex items-center justify-center mx-auto mb-2">
              <span className="text-dusty-rose text-lg">💝</span>
            </div>
            <p className="text-xs text-warm-gray">С любовью</p>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
