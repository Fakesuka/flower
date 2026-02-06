import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Heart, Share2, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { sizeOptions, colorPalettes } from '@/data';
import { useAppStore } from '@/store';
import { useTelegram } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';
import type { SizeOption, ColorOption } from '@/types';

export function ProductScreen() {
  const { selectedProduct, navigateTo, addToCart, goBack, user, addToFavorites, removeFromFavorites } = useAppStore();
  const { hapticImpact, hapticSelection, hapticNotification } = useTelegram();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<SizeOption>(sizeOptions[1]);
  const [selectedColor, setSelectedColor] = useState<ColorOption>(colorPalettes[0]);
  const [quantity, setQuantity] = useState(1);
  const [expandedSection, setExpandedSection] = useState<string | null>('description');
  const [isAdding, setIsAdding] = useState(false);

  if (!selectedProduct) {
    navigateTo('catalog');
    return null;
  }

  const images = selectedProduct.images || [selectedProduct.image];
  const isFavorite = user?.favorites.includes(selectedProduct.id);
  const totalPrice = (selectedProduct.price + (selectedSize?.priceModifier || 0)) * quantity;

  const handleSizeSelect = (size: SizeOption) => {
    hapticSelection();
    setSelectedSize(size);
  };

  const handleColorSelect = (color: ColorOption) => {
    hapticSelection();
    setSelectedColor(color);
  };

  const handleAddToCart = () => {
    hapticImpact('medium');
    setIsAdding(true);
    
    const cartItem = {
      id: `cart-${Date.now()}`,
      product: selectedProduct,
      quantity,
      selectedSize,
      selectedColor,
    };
    
    addToCart(cartItem);
    hapticNotification('success');
    
    setTimeout(() => {
      setIsAdding(false);
      navigateTo('cart');
    }, 500);
  };

  const handleFavoriteToggle = () => {
    hapticImpact('light');
    if (isFavorite) {
      removeFromFavorites(selectedProduct.id);
    } else {
      addToFavorites(selectedProduct.id);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen pb-28 safe-top">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-milk/95 backdrop-blur-xl px-4 py-3 flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={goBack}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-card"
        >
          <ChevronLeft className="w-5 h-5 text-espresso" />
        </motion.button>
        
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleFavoriteToggle}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center shadow-card',
              isFavorite ? 'bg-dusty-rose text-white' : 'bg-white text-espresso'
            )}
          >
            <Heart className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-card"
          >
            <Share2 className="w-5 h-5 text-espresso" />
          </motion.button>
        </div>
      </header>

      {/* Image Gallery */}
      <section className="relative">
        <div className="aspect-square bg-milk overflow-hidden">
          <motion.img
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            src={images[currentImageIndex]}
            alt={selectedProduct.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 justify-center mt-3 px-4">
            {images.map((image: string, idx: number) => (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentImageIndex(idx)}
                className={cn(
                  'w-14 h-14 rounded-xl overflow-hidden border-2 transition-colors',
                  currentImageIndex === idx 
                    ? 'border-dusty-rose' 
                    : 'border-transparent'
                )}
              >
                <img
                  src={image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </motion.button>
            ))}
          </div>
        )}
        
        {/* Image Indicators */}
        <div className="flex justify-center gap-1.5 mt-3">
          {images.map((_: string, idx: number) => (
            <div
              key={idx}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-colors',
                currentImageIndex === idx ? 'bg-dusty-rose' : 'bg-warm-gray/30'
              )}
            />
          ))}
        </div>
      </section>

      {/* Product Info */}
      <section className="px-4 py-5">
        <div className="flex items-start justify-between mb-2">
          <h1 className="font-serif text-2xl text-espresso flex-1">
            {selectedProduct.name}
          </h1>
          <div className="text-right">
            <span className="font-semibold text-xl text-espresso">
              {totalPrice.toLocaleString('ru-RU')} ₽
            </span>
            {selectedSize?.priceModifier > 0 && (
              <p className="text-warm-gray text-xs">
                +{selectedSize.priceModifier.toLocaleString('ru-RU')} ₽ за размер
              </p>
            )}
          </div>
        </div>
        
        <p className="text-warm-gray text-sm mb-5">
          {selectedProduct.description}
        </p>

        {/* Size Selector */}
        {selectedProduct.sizes && (
          <div className="mb-5">
            <h3 className="font-medium text-espresso mb-3">
              Размер: <span className="text-warm-gray font-normal">{selectedSize.name}</span>
            </h3>
            <div className="flex gap-2">
              {selectedProduct.sizes.map((size: SizeOption) => (
                <motion.button
                  key={size.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSizeSelect(size)}
                  className={cn(
                    'flex-1 py-3 px-2 rounded-xl text-center transition-all duration-200',
                    selectedSize.id === size.id
                      ? 'bg-dusty-rose text-white'
                      : 'bg-white text-espresso hover:bg-milk'
                  )}
                >
                  <span className="font-semibold text-lg">{size.label}</span>
                  <p className="text-[10px] opacity-80 mt-0.5">{size.name}</p>
                </motion.button>
              ))}
            </div>
            <p className="text-warm-gray text-xs mt-2">
              {selectedSize.description}
            </p>
          </div>
        )}

        {/* Color Palette Selector */}
        {selectedProduct.colors && (
          <div className="mb-5">
            <h3 className="font-medium text-espresso mb-3">
              Палитра: <span className="text-warm-gray font-normal">{selectedColor.name}</span>
            </h3>
            <div className="flex gap-3">
              {selectedProduct.colors.map((color: ColorOption) => (
                <motion.button
                  key={color.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleColorSelect(color)}
                  className={cn(
                    'w-12 h-12 rounded-full border-2 transition-all duration-200',
                    selectedColor.id === color.id
                      ? 'border-dusty-rose scale-110'
                      : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: color.hex }}
                >
                  {selectedColor.id === color.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <Check className="w-5 h-5 text-espresso drop-shadow-sm" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Accordion Sections */}
        <div className="space-y-2 mb-5">
          {selectedProduct.composition && (
            <GlassCard className="overflow-hidden" animate={false}>
              <button
                onClick={() => toggleSection('composition')}
                className="w-full flex items-center justify-between p-4"
              >
                <span className="font-medium text-espresso">Состав букета</span>
                {expandedSection === 'composition' ? (
                  <ChevronUp className="w-5 h-5 text-warm-gray" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-warm-gray" />
                )}
              </button>
              <AnimatePresence>
                {expandedSection === 'composition' && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4">
                      <ul className="flex flex-wrap gap-2">
                        {selectedProduct.composition.map((item: string, idx: number) => (
                          <li
                            key={idx}
                            className="px-3 py-1.5 bg-milk rounded-full text-sm text-espresso"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          )}
          
          <GlassCard className="overflow-hidden" animate={false}>
            <button
              onClick={() => toggleSection('delivery')}
              className="w-full flex items-center justify-between p-4"
            >
              <span className="font-medium text-espresso">Доставка и уход</span>
              {expandedSection === 'delivery' ? (
                <ChevronUp className="w-5 h-5 text-warm-gray" />
              ) : (
                <ChevronDown className="w-5 h-5 text-warm-gray" />
              )}
            </button>
            <AnimatePresence>
              {expandedSection === 'delivery' && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 text-sm text-warm-gray space-y-2">
                    <p>• Быстрая доставка по городу</p>
                    <p>• Бесплатная доставка от 3000 ₽</p>
                    <p>• Смена воды каждые 2 дня продлевает жизнь букета</p>
                    <p>• Держите подальше от прямых солнечных лучей</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </div>
      </section>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-milk px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-40">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <QuantityStepper
            value={quantity}
            onChange={setQuantity}
            className="flex-shrink-0"
          />
          <AnimatedButton
            onClick={handleAddToCart}
            disabled={isAdding}
            className="flex-1"
          >
            {isAdding ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                Добавлено
              </motion.div>
            ) : (
              `В корзину · ${totalPrice.toLocaleString('ru-RU')} ₽`
            )}
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
}
