import { useState, useEffect } from 'react';
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
  Percent,
  Settings,
  Truck,
  Users,
  Palette,
  Sun,
  Snowflake,
  Flower2,
  Leaf
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { useApiStore } from '@/store/apiStore';
import { useTelegram } from '@/hooks/useTelegram';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import type { Product, Story, DiscountCard, AppSettings } from '@/types';

type AdminTab = 'products' | 'stories' | 'cards' | 'settings' | 'admins';

const SEASONAL_THEMES = [
  { id: 'winter', name: 'Зима', icon: Snowflake, color: 'bg-blue-100 text-blue-600' },
  { id: 'spring', name: 'Весна', icon: Flower2, color: 'bg-pink-100 text-pink-600' },
  { id: 'summer', name: 'Лето', icon: Sun, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'autumn', name: 'Осень', icon: Leaf, color: 'bg-orange-100 text-orange-600' },
] as const;

export function AdminScreen() {
  const { goBack, settings, fetchSettings, isAdmin, adminRole } = useApiStore();
  const { hapticImpact, hapticNotification } = useTelegram();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [pendingCards, setPendingCards] = useState<DiscountCard[]>([]);
  const [admins, setAdmins] = useState<Array<{ id: number; telegram_id: string; name?: string; role: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  
  // Edit modals
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingStory, setIsAddingStory] = useState(false);
  
  // Card approval modal
  const [approvingCard, setApprovingCard] = useState<DiscountCard | null>(null);
  const [discountPercent, setDiscountPercent] = useState(5);

  // Settings state
  const [localSettings, setLocalSettings] = useState<Partial<AppSettings>>({});
  
  // Admin management
  const [newAdminId, setNewAdminId] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'florist'>('florist');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Update local settings when settings change
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const loadData = async () => {
    try {
      // Load products
      const productsRes = await api.products.getAll();
      if (productsRes.data) setProducts(productsRes.data);

      // Load stories
      const storiesRes = await api.stories.getAll();
      if (storiesRes.data) setStories(storiesRes.data);

      // Load categories
      const categoriesRes = await api.categories.getAll();
      if (categoriesRes.data) setCategories(categoriesRes.data);

      // Load pending cards
      const cardsRes = await api.discountCards.getPending();
      if (cardsRes.data) setPendingCards(cardsRes.data);

      // Load admins
      const adminsRes = await api.admins.getAll();
      if (adminsRes.data) setAdmins(adminsRes.data);

      // Load settings
      await fetchSettings();
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const handleSaveProduct = async (product: Product) => {
    hapticImpact('medium');
    try {
      if (isAddingProduct) {
        // API call to create product would go here
        setProducts([...products, { ...product, id: `prod-${Date.now()}` }]);
        setIsAddingProduct(false);
      } else {
        // API call to update product would go here
        setProducts(products.map(p => p.id === product.id ? product : p));
      }
      setEditingProduct(null);
      hapticNotification('success');
    } catch (error) {
      hapticNotification('error');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    hapticImpact('light');
    try {
      // API call to delete product would go here
      setProducts(products.filter(p => p.id !== productId));
      hapticNotification('success');
    } catch (error) {
      hapticNotification('error');
    }
  };

  const handleSaveStory = async (story: Story) => {
    hapticImpact('medium');
    try {
      if (isAddingStory) {
        setStories([...stories, { ...story, id: `story-${Date.now()}` }]);
        setIsAddingStory(false);
      } else {
        setStories(stories.map(s => s.id === story.id ? story : s));
      }
      setEditingStory(null);
      hapticNotification('success');
    } catch (error) {
      hapticNotification('error');
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    hapticImpact('light');
    try {
      setStories(stories.filter(s => s.id !== storyId));
      hapticNotification('success');
    } catch (error) {
      hapticNotification('error');
    }
  };

  const handleApproveCard = async () => {
    if (!approvingCard) return;
    hapticImpact('medium');
    try {
      await api.discountCards.approve(approvingCard.id, discountPercent);
      setPendingCards(pendingCards.filter(c => c.id !== approvingCard.id));
      setApprovingCard(null);
      hapticNotification('success');
    } catch (error) {
      hapticNotification('error');
    }
  };

  const handleRejectCard = async (cardId: string) => {
    hapticImpact('light');
    try {
      await api.discountCards.reject(cardId);
      setPendingCards(pendingCards.filter(c => c.id !== cardId));
      hapticNotification('error');
    } catch (error) {
      hapticNotification('error');
    }
  };

  const handleSaveSettings = async () => {
    hapticImpact('medium');
    try {
      await api.settings.update(localSettings);
      await fetchSettings();
      hapticNotification('success');
    } catch (error) {
      hapticNotification('error');
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminId.trim()) return;
    hapticImpact('medium');
    try {
      await api.admins.add(newAdminId.trim(), newAdminName.trim() || undefined, newAdminRole);
      const adminsRes = await api.admins.getAll();
      if (adminsRes.data) setAdmins(adminsRes.data);
      setNewAdminId('');
      setNewAdminName('');
      hapticNotification('success');
    } catch (error) {
      hapticNotification('error');
    }
  };

  const handleRemoveAdmin = async (telegramId: string) => {
    hapticImpact('light');
    try {
      await api.admins.remove(telegramId);
      setAdmins(admins.filter(a => a.telegram_id !== telegramId));
      hapticNotification('success');
    } catch (error) {
      hapticNotification('error');
    }
  };
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 safe-top safe-bottom">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-dusty-rose/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-dusty-rose" />
          </div>
          <h2 className="font-serif text-2xl text-espresso mb-3">
            Доступ запрещён
          </h2>
          <p className="text-warm-gray mb-6">
            У вас нет прав для доступа к админ-панели
          </p>
          <AnimatedButton onClick={goBack}>
            Назад
          </AnimatedButton>
        </div>
      </div>
    );
  }

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
            <p className="text-warm-gray text-xs">
              {adminRole === 'admin' ? 'Полный доступ' : 'Доступ флориста'}
            </p>
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
            Товары
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
            Истории
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
          {adminRole === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('settings')}
                className={cn(
                  'flex-shrink-0 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors',
                  activeTab === 'settings'
                    ? 'bg-dusty-rose text-white'
                    : 'bg-white text-espresso'
                )}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Настройки
              </button>
              <button
                onClick={() => setActiveTab('admins')}
                className={cn(
                  'flex-shrink-0 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors',
                  activeTab === 'admins'
                    ? 'bg-dusty-rose text-white'
                    : 'bg-white text-espresso'
                )}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Админы
              </button>
            </>
          )}
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
                category: categories[0]?.id || '',
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
                        <p className="font-mono text-espresso text-lg">
                          #{card.number}
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

      {/* Settings Tab */}
      {activeTab === 'settings' && adminRole === 'admin' && (
        <div className="px-4 py-4 space-y-6">
          {/* Seasonal Theme */}
          <section>
            <h2 className="font-medium text-espresso mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Сезонная тема
            </h2>
            <GlassCard className="p-4" animate={false}>
              <div className="grid grid-cols-2 gap-3">
                {SEASONAL_THEMES.map((theme) => {
                  const Icon = theme.icon;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => setLocalSettings({ ...localSettings, seasonalTheme: theme.id as any })}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl transition-all',
                        localSettings.seasonalTheme === theme.id
                          ? 'bg-dusty-rose/10 ring-2 ring-dusty-rose'
                          : 'bg-milk hover:bg-milk/80'
                      )}
                    >
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', theme.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-espresso">{theme.name}</span>
                    </button>
                  );
                })}
              </div>
            </GlassCard>
          </section>

          {/* Delivery Prices */}
          <section>
            <h2 className="font-medium text-espresso mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Стоимость доставки
            </h2>
            <GlassCard className="p-4 space-y-4" animate={false}>
              <div>
                <label className="text-sm text-warm-gray mb-1.5 block">По городу (₽)</label>
                <input
                  type="number"
                  value={localSettings.deliveryCityPrice || 500}
                  onChange={(e) => setLocalSettings({ ...localSettings, deliveryCityPrice: Number(e.target.value) })}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="text-sm text-warm-gray mb-1.5 block">За городом (₽)</label>
                <input
                  type="number"
                  value={localSettings.deliveryOutskirtsPrice || 800}
                  onChange={(e) => setLocalSettings({ ...localSettings, deliveryOutskirtsPrice: Number(e.target.value) })}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="text-sm text-warm-gray mb-1.5 block">Бесплатная доставка от (₽)</label>
                <input
                  type="number"
                  value={localSettings.freeDeliveryThreshold || 3000}
                  onChange={(e) => setLocalSettings({ ...localSettings, freeDeliveryThreshold: Number(e.target.value) })}
                  className="input-field w-full"
                />
              </div>
            </GlassCard>
          </section>

          {/* Shop Info */}
          <section>
            <h2 className="font-medium text-espresso mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Информация о магазине
            </h2>
            <GlassCard className="p-4 space-y-4" animate={false}>
              <div>
                <label className="text-sm text-warm-gray mb-1.5 block">Название магазина</label>
                <input
                  type="text"
                  value={localSettings.shopName || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, shopName: e.target.value })}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="text-sm text-warm-gray mb-1.5 block">Телефон</label>
                <input
                  type="text"
                  value={localSettings.shopPhone || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, shopPhone: e.target.value })}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="text-sm text-warm-gray mb-1.5 block">Адрес Цветочной лавки</label>
                <input
                  type="text"
                  value={localSettings.shopAddressCvetochaya || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, shopAddressCvetochaya: e.target.value })}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="text-sm text-warm-gray mb-1.5 block">Адрес Флоренции</label>
                <input
                  type="text"
                  value={localSettings.shopAddressFlorenciya || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, shopAddressFlorenciya: e.target.value })}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="text-sm text-warm-gray mb-1.5 block">Часы работы</label>
                <input
                  type="text"
                  value={localSettings.workingHours || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, workingHours: e.target.value })}
                  className="input-field w-full"
                />
              </div>
            </GlassCard>
          </section>

          <AnimatedButton onClick={handleSaveSettings} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Сохранить настройки
          </AnimatedButton>
        </div>
      )}

      {/* Admins Tab */}
      {activeTab === 'admins' && adminRole === 'admin' && (
        <div className="px-4 py-4">
          <GlassCard className="p-4 mb-4" animate={false}>
            <h3 className="font-medium text-espresso mb-3">Добавить администратора</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-warm-gray mb-1.5 block">Telegram ID</label>
                <input
                  type="text"
                  value={newAdminId}
                  onChange={(e) => setNewAdminId(e.target.value)}
                  placeholder="123456789"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="text-sm text-warm-gray mb-1.5 block">Имя (опционально)</label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Иван"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="text-sm text-warm-gray mb-1.5 block">Роль</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as 'admin' | 'florist')}
                  className="input-field w-full"
                >
                  <option value="florist">Флорист</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
              <AnimatedButton onClick={handleAddAdmin} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Добавить
              </AnimatedButton>
            </div>
          </GlassCard>

          <h3 className="font-medium text-espresso mb-3">Список администраторов</h3>
          <div className="space-y-3">
            {admins.map((admin, index) => (
              <motion.div
                key={admin.telegram_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="p-4" animate={false}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-dusty-rose/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-dusty-rose" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-espresso">
                        {admin.name || 'Без имени'}
                      </p>
                      <p className="text-warm-gray text-xs font-mono">
                        ID: {admin.telegram_id}
                      </p>
                      <span className={cn(
                        'inline-block mt-1 px-2 py-0.5 text-[10px] rounded-full',
                        admin.role === 'admin' 
                          ? 'bg-dusty-rose/20 text-dusty-rose' 
                          : 'bg-eucalyptus/20 text-eucalyptus'
                      )}>
                        {admin.role === 'admin' ? 'Администратор' : 'Флорист'}
                      </span>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemoveAdmin(admin.telegram_id)}
                      className="w-8 h-8 rounded-lg bg-milk flex items-center justify-center text-dusty-rose"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
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
              
              <p className="font-mono text-espresso text-lg mb-6">
                #{approvingCard.number}
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
