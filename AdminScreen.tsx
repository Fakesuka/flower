import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Package, 
  Image as ImageIcon, 
  Save,
  X,
  Search,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Percent
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { categories, products as initialProducts, stories as initialStories } from '@/data';
import { useAppStore } from '@/store';
import { useTelegram } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';
import type { Product, Story, DiscountCard } from '@/types';

type AdminTab = 'products' | 'stories' | 'cards';

// Mock pending cards for admin
const mockPendingCards: DiscountCard[] = [
  {
    id: 'card-1',
    number: '123456789012',
    discountPercent: 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'card-2',
    number: '987654321098',
    discountPercent: 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

export function AdminScreen() {
  const { goBack, approveDiscountCard, rejectDiscountCard } = useAppStore();
  const { hapticImpact, hapticNotification } = useTelegram();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [pendingCards, setPendingCards] = useState<DiscountCard[]>(mockPendingCards);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Edit modals
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingStory, setIsAddingStory] = useState(false);
  
  // Card approval modal
  const [approvingCard, setApprovingCard] = useState<DiscountCard | null>(null);
  const [discountPercent, setDiscountPercent] = useState(5);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const handleSaveProduct = (product: Product) => {
    hapticImpact('medium');
    if (isAddingProduct) {
      setProducts([...products, { ...product, id: `prod-${Date.now()}` }]);
      setIsAddingProduct(false);
    } else {
      setProducts(products.map(p => p.id === product.id ? product : p));
    }
    setEditingProduct(null);
    hapticNotification('success');
  };

  const handleDeleteProduct = (productId: string) => {
    hapticImpact('light');
    setProducts(products.filter(p => p.id !== productId));
    hapticNotification('success');
  };

  const handleSaveStory = (story: Story) => {
    hapticImpact('medium');
    if (isAddingStory) {
      setStories([...stories, { ...story, id: `story-${Date.now()}` }]);
      setIsAddingStory(false);
    } else {
      setStories(stories.map(s => s.id === story.id ? story : s));
    }
    setEditingStory(null);
    hapticNotification('success');
  };

  const handleDeleteStory = (storyId: string) => {
    hapticImpact('light');
    setStories(stories.filter(s => s.id !== storyId));
    hapticNotification('success');
  };

  const handleApproveCard = () => {
    if (!approvingCard) return;
    hapticImpact('medium');
    approveDiscountCard(discountPercent);
    setPendingCards(pendingCards.filter(c => c.id !== approvingCard.id));
    setApprovingCard(null);
    hapticNotification('success');
  };

  const handleRejectCard = (cardId: string) => {
    hapticImpact('light');
    rejectDiscountCard();
    setPendingCards(pendingCards.filter(c => c.id !== cardId));
    hapticNotification('error');
  };

  const formatCardNumber = (num: string) => {
    return num.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  return (
    <div className="min-h-screen pb-24 safe-top">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-milk/95 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center gap-3 mb-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={goBack}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-card"
          >
            <ChevronLeft className="w-5 h-5 text-espresso" />
          </motion.button>
          <div>
            <h1 className="font-serif text-xl text-espresso">Админ-панель</h1>
            <p className="text-warm-gray text-xs">Управление магазином</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('products')}
            className={cn(
              'flex-shrink-0 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors',
              activeTab === 'products'
                ? 'bg-dusty-rose text-white'
                : 'bg-white text-espresso'
            )}
          >
            <Package className="w-4 h-4 inline mr-2" />
            Товары ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('stories')}
            className={cn(
              'flex-shrink-0 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors',
              activeTab === 'stories'
                ? 'bg-dusty-rose text-white'
                : 'bg-white text-espresso'
            )}
          >
            <ImageIcon className="w-4 h-4 inline mr-2" />
            Истории ({stories.length})
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={cn(
              'flex-shrink-0 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors',
              activeTab === 'cards'
                ? 'bg-dusty-rose text-white'
                : 'bg-white text-espresso'
            )}
          >
            <CreditCard className="w-4 h-4 inline mr-2" />
            Карты ({pendingCards.length})
          </button>
        </div>
      </header>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="px-4 py-4">
          {/* Search & Filter */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />
              <input
                type="text"
                placeholder="Поиск товаров..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field w-full pl-10"
              />
            </div>
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="input-field px-3"
            >
              <option value="">Все категории</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Add Button */}
          <AnimatedButton
            onClick={() => {
              setIsAddingProduct(true);
              setEditingProduct({
                id: '',
                name: '',
                price: 0,
                image: '',
                category: categories[0].id,
                description: '',
              });
            }}
            className="w-full mb-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить товар
          </AnimatedButton>

          {/* Products List */}
          <div className="space-y-3">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="p-3" animate={false}>
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-espresso text-sm line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-dusty-rose font-semibold text-sm">
                        {product.price.toLocaleString('ru-RU')} ₽
                      </p>
                      <p className="text-warm-gray text-xs">
                        {categories.find(c => c.id === product.category)?.name}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setEditingProduct(product)}
                        className="w-8 h-8 rounded-lg bg-milk flex items-center justify-center text-eucalyptus"
                      >
                        <Edit2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteProduct(product.id)}
                        className="w-8 h-8 rounded-lg bg-milk flex items-center justify-center text-dusty-rose"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Stories Tab */}
      {activeTab === 'stories' && (
        <div className="px-4 py-4">
          {/* Add Button */}
          <AnimatedButton
            onClick={() => {
              setIsAddingStory(true);
              setEditingStory({
                id: '',
                image: '',
                title: '',
                isNew: true,
              });
            }}
            className="w-full mb-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить историю
          </AnimatedButton>

          {/* Stories Grid */}
          <div className="grid grid-cols-2 gap-3">
            {stories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="overflow-hidden" animate={false}>
                  <div className="aspect-square relative">
                    <img
                      src={story.image}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                    {story.isNew && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-dusty-rose text-white text-[10px] font-semibold rounded-full">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-espresso text-sm mb-2">{story.title}</p>
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setEditingStory(story)}
                        className="flex-1 py-1.5 rounded-lg bg-milk text-eucalyptus text-xs font-medium"
                      >
                        <Edit2 className="w-3 h-3 inline mr-1" />
                        Изменить
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteStory(story.id)}
                        className="flex-1 py-1.5 rounded-lg bg-milk text-dusty-rose text-xs font-medium"
                      >
                        <Trash2 className="w-3 h-3 inline mr-1" />
                        Удалить
                      </motion.button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Cards Tab */}
      {activeTab === 'cards' && (
        <div className="px-4 py-4">
          <h2 className="font-medium text-espresso mb-4">
            Заявки на скидочные карты ({pendingCards.length})
          </h2>
          
          {pendingCards.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-milk flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-eucalyptus" />
              </div>
              <p className="text-warm-gray">Нет новых заявок</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassCard className="p-4" animate={false}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-dusty-rose/10 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-dusty-rose" />
                      </div>
                      <div className="flex-1">
                        <p className="font-mono text-espresso text-lg tracking-wider">
                          {formatCardNumber(card.number)}
                        </p>
                        <p className="text-warm-gray text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(card.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-warm-gray/20 text-warm-gray text-xs rounded-full">
                        На проверке
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setApprovingCard(card)}
                        className="flex-1 py-2.5 rounded-xl bg-eucalyptus text-white text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Одобрить
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRejectCard(card.id)}
                        className="flex-1 py-2.5 rounded-xl bg-milk text-dusty-rose text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Отклонить
                      </motion.button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Edit Modal */}
      <AnimatePresence>
        {editingProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-auto"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-xl text-espresso">
                    {isAddingProduct ? 'Новый товар' : 'Редактировать товар'}
                  </h2>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setIsAddingProduct(false);
                    }}
                    className="w-10 h-10 rounded-full bg-milk flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-espresso" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-warm-gray mb-1.5 block">Название</label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="input-field w-full"
                      placeholder="Название товара"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-warm-gray mb-1.5 block">Цена</label>
                    <input
                      type="number"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      className="input-field w-full"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-warm-gray mb-1.5 block">Категория</label>
                    <select
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="input-field w-full"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-warm-gray mb-1.5 block">URL изображения</label>
                    <input
                      type="text"
                      value={editingProduct.image}
                      onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                      className="input-field w-full"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="text-sm text-warm-gray mb-1.5 block">Описание</label>
                    <textarea
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="input-field w-full h-24 resize-none"
                      placeholder="Описание товара..."
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <AnimatedButton
                      variant="secondary"
                      onClick={() => {
                        setEditingProduct(null);
                        setIsAddingProduct(false);
                      }}
                      className="flex-1"
                    >
                      Отмена
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={() => handleSaveProduct(editingProduct)}
                      className="flex-1"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Сохранить
                    </AnimatedButton>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Edit Modal */}
      <AnimatePresence>
        {editingStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-xl text-espresso">
                    {isAddingStory ? 'Новая история' : 'Редактировать историю'}
                  </h2>
                  <button
                    onClick={() => {
                      setEditingStory(null);
                      setIsAddingStory(false);
                    }}
                    className="w-10 h-10 rounded-full bg-milk flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-espresso" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-warm-gray mb-1.5 block">Название</label>
                    <input
                      type="text"
                      value={editingStory.title}
                      onChange={(e) => setEditingStory({ ...editingStory, title: e.target.value })}
                      className="input-field w-full"
                      placeholder="Название истории"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-warm-gray mb-1.5 block">URL изображения</label>
                    <input
                      type="text"
                      value={editingStory.image}
                      onChange={(e) => setEditingStory({ ...editingStory, image: e.target.value })}
                      className="input-field w-full"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isNew"
                      checked={editingStory.isNew}
                      onChange={(e) => setEditingStory({ ...editingStory, isNew: e.target.checked })}
                      className="w-5 h-5 rounded border-warm-gray text-dusty-rose focus:ring-dusty-rose"
                    />
                    <label htmlFor="isNew" className="text-sm text-espresso">Отметить как новую</label>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <AnimatedButton
                      variant="secondary"
                      onClick={() => {
                        setEditingStory(null);
                        setIsAddingStory(false);
                      }}
                      className="flex-1"
                    >
                      Отмена
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={() => handleSaveStory(editingStory)}
                      className="flex-1"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Сохранить
                    </AnimatedButton>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Approval Modal */}
      <AnimatePresence>
        {approvingCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6"
            >
              <h2 className="font-serif text-xl text-espresso mb-4">
                Одобрить карту
              </h2>
              
              <p className="font-mono text-espresso text-lg tracking-wider mb-6">
                {formatCardNumber(approvingCard.number)}
              </p>

              <div className="mb-6">
                <label className="text-sm text-warm-gray mb-2 block flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Размер скидки
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="3"
                    max="20"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold text-dusty-rose w-16 text-right">
                    {discountPercent}%
                  </span>
                </div>
                <div className="flex justify-between text-xs text-warm-gray mt-1">
                  <span>3%</span>
                  <span>20%</span>
                </div>
              </div>

              <div className="flex gap-3">
                <AnimatedButton
                  variant="secondary"
                  onClick={() => setApprovingCard(null)}
                  className="flex-1"
                >
                  Отмена
                </AnimatedButton>
                <AnimatedButton
                  onClick={handleApproveCard}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Одобрить
                </AnimatedButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
