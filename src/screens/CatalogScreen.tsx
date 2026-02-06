import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { CategoryPill } from '@/components/ui/CategoryPill';
import { ProductCard } from '@/components/ui/ProductCard';
import { categories, products } from '@/data';
import { useAppStore } from '@/store';
import { useTelegram } from '@/hooks/useTelegram';


export function CatalogScreen() {
  const { navigateTo, setSelectedProduct, selectedCategory, setSelectedCategory, user } = useAppStore();
  const { hapticImpact, hapticSelection } = useTelegram();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceSort, setPriceSort] = useState<'asc' | 'desc' | null>(null);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    // Filter by category
    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }
    
    // Sort by price
    if (priceSort) {
      result.sort((a, b) => 
        priceSort === 'asc' ? a.price - b.price : b.price - a.price
      );
    }
    
    return result;
  }, [selectedCategory, searchQuery, priceSort]);

  const handleCategoryClick = (categoryId: string) => {
    hapticSelection();
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
  };

  const handleProductClick = (product: typeof products[0]) => {
    hapticImpact('light');
    setSelectedProduct(product);
    navigateTo('product');
  };

  const clearFilters = () => {
    hapticImpact('light');
    setSelectedCategory(null);
    setSearchQuery('');
    setPriceSort(null);
  };

  const hasFilters = selectedCategory || searchQuery || priceSort;

  return (
    <div className="min-h-screen pb-24 safe-top">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-milk/95 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="font-serif text-2xl text-espresso">Каталог</h1>
          <span className="text-warm-gray text-sm">
            {filteredProducts.length} товаров
          </span>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />
          <input
            type="text"
            placeholder="Поиск букетов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-warm-gray" />
            </button>
          )}
        </div>
      </header>

      {/* Categories & Filters */}
      <section className="px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 overflow-x-auto hide-scrollbar">
            <div className="flex gap-2">
              {categories.map((category, index) => (
                <CategoryPill
                  key={category.id}
                  {...category}
                  isActive={selectedCategory === category.id}
                  index={index}
                  onClick={() => handleCategoryClick(category.id)}
                />
              ))}
            </div>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`
              flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
              transition-colors duration-200 flex-shrink-0
              ${showFilters ? 'bg-dusty-rose text-white' : 'bg-white text-espresso'}
            `}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Фильтры
          </motion.button>
        </div>
        
        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
              className="overflow-hidden"
            >
              <GlassCard className="p-4 mb-3" animate={false}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-espresso">Сортировка по цене</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPriceSort(priceSort === 'asc' ? null : 'asc')}
                    className={`
                      flex-1 py-2 px-3 rounded-lg text-sm font-medium
                      transition-colors duration-200
                      ${priceSort === 'asc' 
                        ? 'bg-dusty-rose text-white' 
                        : 'bg-milk text-espresso hover:bg-light-green/20'}
                    `}
                  >
                    Сначала дешевле
                  </button>
                  <button
                    onClick={() => setPriceSort(priceSort === 'desc' ? null : 'desc')}
                    className={`
                      flex-1 py-2 px-3 rounded-lg text-sm font-medium
                      transition-colors duration-200
                      ${priceSort === 'desc' 
                        ? 'bg-dusty-rose text-white' 
                        : 'bg-milk text-espresso hover:bg-light-green/20'}
                    `}
                  >
                    Сначала дороже
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Active Filters */}
        {hasFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-3"
          >
            <span className="text-sm text-warm-gray">Активные фильтры:</span>
            <button
              onClick={clearFilters}
              className="text-dusty-rose text-sm font-medium flex items-center gap-1"
            >
              Сбросить
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </section>

      {/* Products Grid */}
      <section className="px-4 py-2">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                onClick={() => handleProductClick(product)}
                isFavorite={user?.favorites.includes(product.id)}
              />
            ))}
          </div>
        ) : (
          <GlassCard className="p-8 text-center" animate={false}>
            <div className="w-16 h-16 rounded-full bg-milk flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-warm-gray" />
            </div>
            <h3 className="font-serif text-lg text-espresso mb-2">
              Ничего не найдено
            </h3>
            <p className="text-warm-gray text-sm mb-4">
              Попробуйте изменить фильтры или поисковый запрос
            </p>
            <AnimatedButton onClick={clearFilters} variant="secondary" size="sm">
              Сбросить фильтры
            </AnimatedButton>
          </GlassCard>
        )}
      </section>
    </div>
  );
}
