import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { builderStyles, builderFlowers, builderPalettes, builderWrappings, messagePresets } from '@/data';
import { useAppStore } from '@/store';
import { useTelegram } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';
import type { BuilderFlower, BuilderPalette, BuilderStyle, BuilderWrapping } from '@/types';

const steps = [
  { id: 1, title: 'Стиль', description: 'Выберите общее настроение букета' },
  { id: 2, title: 'Цветы', description: 'Добавьте до 3 видов цветов' },
  { id: 3, title: 'Палитра', description: 'Выберите цветовую гамму' },
  { id: 4, title: 'Упаковка', description: 'Как завернуть букет' },
  { id: 5, title: 'Открытка', description: 'Добавьте пожелание' },
];

export function BuilderScreen() {
  const { navigateTo, builderState, updateBuilderState, addBuilderToCart, goBack } = useAppStore();
  const { hapticImpact, hapticSelection, hapticNotification } = useTelegram();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleting, setIsCompleting] = useState(false);

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!builderState.style;
      case 2: return builderState.flowers.length > 0;
      case 3: return !!builderState.palette;
      case 4: return !!builderState.wrapping;
      case 5: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    hapticImpact('light');
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    hapticImpact('light');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      goBack();
    }
  };

  const handleComplete = () => {
    hapticNotification('success');
    setIsCompleting(true);
    setTimeout(() => {
      addBuilderToCart();
      navigateTo('cart');
    }, 600);
  };

  const handleStyleSelect = (style: BuilderStyle) => {
    hapticSelection();
    updateBuilderState({ style });
  };

  const handleFlowerToggle = (flower: BuilderFlower) => {
    hapticSelection();
    const exists = builderState.flowers.find((f: BuilderFlower) => f.id === flower.id);
    if (exists) {
      updateBuilderState({
        flowers: builderState.flowers.filter((f: BuilderFlower) => f.id !== flower.id)
      });
    } else if (builderState.flowers.length < 3) {
      updateBuilderState({
        flowers: [...builderState.flowers, flower]
      });
    }
  };

  const handlePaletteSelect = (palette: BuilderPalette) => {
    hapticSelection();
    updateBuilderState({ palette });
  };

  const handleWrappingSelect = (wrapping: BuilderWrapping) => {
    hapticSelection();
    updateBuilderState({ wrapping });
  };

  const handleMessageSelect = (presetId: string, text: string) => {
    hapticSelection();
    updateBuilderState({ 
      messagePreset: presetId,
      message: presetId === 'custom' ? '' : text
    });
  };

  const getTotalPrice = () => {
    const flowersPrice = builderState.flowers.reduce((sum: number, f: BuilderFlower) => sum + f.price, 0);
    const wrappingPrice = builderState.wrapping?.price || 0;
    return flowersPrice + wrappingPrice;
  };

  return (
    <div className="min-h-screen pb-28 safe-top">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-milk/95 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center gap-3 mb-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-card"
          >
            <ChevronLeft className="w-5 h-5 text-espresso" />
          </motion.button>
          <div>
            <h1 className="font-serif text-xl text-espresso">Собрать букет</h1>
            <p className="text-warm-gray text-xs">Шаг {currentStep} из 5</p>
          </div>
        </div>
        
        {/* Progress Dots */}
        <div className="flex gap-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                'flex-1 h-1.5 rounded-full transition-colors duration-300',
                step.id <= currentStep ? 'bg-dusty-rose' : 'bg-warm-gray/20'
              )}
            />
          ))}
        </div>
      </header>

      {/* Preview */}
      <section className="px-4 py-4">
        <GlassCard className="p-4 flex items-center gap-4" animate={false}>
          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
            <img
              src={builderState.style?.image || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=200&h=200&fit=crop'}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-espresso mb-1">
              {builderState.style?.name || 'Выберите стиль'}
            </h3>
            <p className="text-warm-gray text-sm mb-2">
              {builderState.flowers.length > 0 
                ? builderState.flowers.map((f: BuilderFlower) => f.name).join(', ')
                : 'Добавьте цветы'}
            </p>
            <p className="font-semibold text-dusty-rose">
              {getTotalPrice() > 0 ? `${getTotalPrice().toLocaleString('ru-RU')} ₽` : '—'}
            </p>
          </div>
        </GlassCard>
      </section>

      {/* Step Content */}
      <section className="px-4 py-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
          >
            <h2 className="font-serif text-lg text-espresso mb-1">
              {steps[currentStep - 1].title}
            </h2>
            <p className="text-warm-gray text-sm mb-4">
              {steps[currentStep - 1].description}
            </p>

            {/* Step 1: Style */}
            {currentStep === 1 && (
              <div className="grid grid-cols-2 gap-3">
                {builderStyles.map((style: BuilderStyle) => (
                  <motion.button
                    key={style.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleStyleSelect(style)}
                    className={cn(
                      'relative rounded-2xl overflow-hidden aspect-[3/4]',
                      'border-2 transition-colors duration-200',
                      builderState.style?.id === style.id
                        ? 'border-dusty-rose'
                        : 'border-transparent'
                    )}
                  >
                    <img
                      src={style.image}
                      alt={style.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-medium text-white mb-0.5">{style.name}</h3>
                      <p className="text-white/70 text-xs">{style.description}</p>
                    </div>
                    {builderState.style?.id === style.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-dusty-rose flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Step 2: Flowers */}
            {currentStep === 2 && (
              <div className="grid grid-cols-2 gap-3">
                {builderFlowers.map((flower: BuilderFlower) => {
                  const isSelected = builderState.flowers.find((f: BuilderFlower) => f.id === flower.id);
                  const canSelect = builderState.flowers.length < 3 || isSelected;
                  
                  return (
                    <motion.button
                      key={flower.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => canSelect && handleFlowerToggle(flower)}
                      disabled={!canSelect}
                      className={cn(
                        'relative rounded-2xl overflow-hidden',
                        'border-2 transition-all duration-200',
                        isSelected
                          ? 'border-dusty-rose'
                          : canSelect
                            ? 'border-transparent'
                            : 'border-transparent opacity-50'
                      )}
                    >
                      <div className="aspect-square">
                        <img
                          src={flower.image}
                          alt={flower.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3 bg-white">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-espresso text-sm">{flower.name}</span>
                          <span className="text-dusty-rose text-sm">+{flower.price} ₽</span>
                        </div>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-dusty-rose flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Step 3: Palette */}
            {currentStep === 3 && (
              <div className="grid grid-cols-2 gap-3">
                {builderPalettes.map((palette: BuilderPalette) => (
                  <motion.button
                    key={palette.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePaletteSelect(palette)}
                    className={cn(
                      'relative rounded-2xl overflow-hidden p-4',
                      'border-2 transition-all duration-200 bg-white',
                      builderState.palette?.id === palette.id
                        ? 'border-dusty-rose'
                        : 'border-transparent'
                    )}
                  >
                    <div className="flex gap-1 mb-3">
                      {palette.colors.map((color: string, i: number) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className="font-medium text-espresso">{palette.name}</span>
                    {builderState.palette?.id === palette.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-dusty-rose flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Step 4: Wrapping */}
            {currentStep === 4 && (
              <div className="grid grid-cols-2 gap-3">
                {builderWrappings.map((wrapping: BuilderWrapping) => (
                  <motion.button
                    key={wrapping.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleWrappingSelect(wrapping)}
                    className={cn(
                      'relative rounded-2xl overflow-hidden',
                      'border-2 transition-all duration-200',
                      builderState.wrapping?.id === wrapping.id
                        ? 'border-dusty-rose'
                        : 'border-transparent'
                    )}
                  >
                    <div className="aspect-square">
                      <img
                        src={wrapping.image}
                        alt={wrapping.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3 bg-white">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-espresso text-sm">{wrapping.name}</span>
                        <span className="text-dusty-rose text-sm">
                          {wrapping.price > 0 ? `+${wrapping.price} ₽` : 'Бесплатно'}
                        </span>
                      </div>
                    </div>
                    {builderState.wrapping?.id === wrapping.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-dusty-rose flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Step 5: Message */}
            {currentStep === 5 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {messagePresets.map((preset) => (
                    <motion.button
                      key={preset.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleMessageSelect(preset.id, preset.text)}
                      className={cn(
                        'p-3 rounded-xl text-sm text-left transition-all duration-200',
                        builderState.messagePreset === preset.id
                          ? 'bg-dusty-rose text-white'
                          : 'bg-white text-espresso hover:bg-milk'
                      )}
                    >
                      {preset.text}
                    </motion.button>
                  ))}
                </div>
                
                {builderState.messagePreset === 'custom' && (
                  <motion.textarea
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    placeholder="Напишите ваше пожелание..."
                    value={builderState.message}
                    onChange={(e) => updateBuilderState({ message: e.target.value })}
                    className="input-field w-full h-24 resize-none"
                  />
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-milk px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-40">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <AnimatedButton
            variant="secondary"
            onClick={handleBack}
            size="md"
            className="flex-shrink-0"
          >
            Назад
          </AnimatedButton>
          <AnimatedButton
            onClick={handleNext}
            disabled={!canProceed() || isCompleting}
            size="md"
            className="flex-1"
          >
            {isCompleting ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                Готово!
              </motion.div>
            ) : currentStep === 5 ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                В корзину
              </>
            ) : (
              'Далее'
            )}
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
}
