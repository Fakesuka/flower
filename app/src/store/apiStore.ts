// Enhanced Store with API Integration
// This store extends the local store with server synchronization

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/services/api';
import type { 
  Product, 
  CartItem, 
  BuilderState, 
  Order, 
  User, 
  Screen,
  Story,
  Category,
  DiscountCard,
  AppSettings
} from '@/types';

interface AppState {
  // Navigation
  currentScreen: Screen;
  previousScreen: Screen | null;
  navigateTo: (screen: Screen) => void;
  goBack: () => void;
  
  // Data Loading States
  isLoading: boolean;
  error: string | null;
  
  // Data
  products: Product[];
  stories: Story[];
  categories: Category[];
  
  // Selected Product
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  
  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  getCartCount: () => number;
  getCartTotalWithDiscount: () => { subtotal: number; discount: number; total: number };
  syncCart: () => Promise<void>;
  
  // Builder
  builderState: BuilderState;
  updateBuilderState: (updates: Partial<BuilderState>) => void;
  resetBuilder: () => void;
  addBuilderToCart: () => Promise<void>;
  
  // Orders
  orders: Order[];
  fetchOrders: () => Promise<void>;
  createOrder: (orderData: Parameters<typeof api.orders.create>[0]) => Promise<Order | null>;
  cancelOrder: (orderId: string) => Promise<void>;
  
  // User
  user: User | null;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  updateUserPhone: (phone: string) => Promise<void>;
  
  // Favorites
  fetchFavorites: () => Promise<void>;
  addToFavorites: (productId: string) => Promise<void>;
  removeFromFavorites: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  
  // Discount Card
  discountCard: DiscountCard | null;
  fetchDiscountCard: () => Promise<void>;
  requestDiscountCard: (cardNumber: string) => Promise<void>;
  removeDiscountCard: () => Promise<void>;
  
  // Settings
  settings: AppSettings | null;
  fetchSettings: () => Promise<void>;
  getDeliveryPrice: (isOutskirts: boolean, subtotal: number) => number;
  
  // Admin
  isAdmin: boolean;
  adminRole: 'admin' | 'florist' | null;
  checkAdminStatus: () => Promise<void>;
  
  // Addresses
  addAddress: (address: import('@/types').Address) => void;
  removeAddress: (index: number) => void;
  
  // Filters
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  
  // Data Fetching
  fetchProducts: (category?: string) => Promise<void>;
  fetchStories: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  searchProducts: (query: string) => Promise<Product[]>;
  
  // Initialize
  initialize: () => Promise<void>;
}

const initialBuilderState: BuilderState = {
  style: undefined,
  flowers: [],
  palette: undefined,
  wrapping: undefined,
  message: '',
  messagePreset: undefined,
};

export const useApiStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentScreen: 'home',
      previousScreen: null,
      navigateTo: (screen: Screen) => set((state) => ({ 
        previousScreen: state.currentScreen,
        currentScreen: screen 
      })),
      goBack: () => set((state) => ({
        currentScreen: state.previousScreen || 'home',
        previousScreen: null,
      })),
      
      // Loading States
      isLoading: false,
      error: null,
      
      // Data
      products: [],
      stories: [],
      categories: [],
      
      // Selected Product
      selectedProduct: null,
      setSelectedProduct: (product: Product | null) => set({ selectedProduct: product }),
      
      // Cart
      cart: [],
      addToCart: async (item: CartItem) => {
        set((state) => ({
          cart: [...state.cart, item]
        }));
        // Sync with server if user is logged in
        try {
          await api.cart.addItem({
            productId: item.product.id,
            quantity: item.quantity,
            selectedSize: item.selectedSize?.id,
            selectedColor: item.selectedColor?.id,
            customMessage: item.customMessage,
          });
        } catch (e) {
          // Silently fail - cart is saved locally
        }
      },
      removeFromCart: async (itemId: string) => {
        set((state) => ({
          cart: state.cart.filter((item: CartItem) => item.id !== itemId)
        }));
        try {
          await api.cart.removeItem(itemId);
        } catch (e) {
          // Silently fail
        }
      },
      updateQuantity: async (itemId: string, quantity: number) => {
        set((state) => ({
          cart: quantity <= 0 
            ? state.cart.filter((item: CartItem) => item.id !== itemId)
            : state.cart.map((item: CartItem) => 
                item.id === itemId ? { ...item, quantity } : item
              )
        }));
        try {
          await api.cart.updateItem(itemId, { quantity });
        } catch (e) {
          // Silently fail
        }
      },
      clearCart: async () => {
        set({ cart: [] });
        try {
          await api.cart.clear();
        } catch (e) {
          // Silently fail
        }
      },
      getCartTotal: () => {
        const state = get();
        return state.cart.reduce((total: number, item: CartItem) => {
          const sizePrice = item.selectedSize?.priceModifier || 0;
          return total + (item.product.price + sizePrice) * item.quantity;
        }, 0);
      },
      getCartCount: () => {
        const state = get();
        return state.cart.reduce((count: number, item: CartItem) => count + item.quantity, 0);
      },
      getCartTotalWithDiscount: () => {
        const state = get();
        const subtotal = state.getCartTotal();
        const card = state.discountCard;
        
        if (card?.status === 'approved') {
          const discount = Math.round(subtotal * (card.discountPercent / 100));
          return { subtotal, discount, total: subtotal - discount };
        }
        
        return { subtotal, discount: 0, total: subtotal };
      },
      syncCart: async () => {
        try {
          const { data } = await api.cart.getMyCart();
          if (data) {
            set({ cart: data });
          }
        } catch (e) {
          // Use local cart if sync fails
        }
      },
      
      // Builder
      builderState: initialBuilderState,
      updateBuilderState: (updates: Partial<BuilderState>) => set((state) => ({
        builderState: { ...state.builderState, ...updates }
      })),
      resetBuilder: () => set({ builderState: initialBuilderState }),
      addBuilderToCart: async () => {
        const state = get();
        const { builderState } = state;
        
        if (!builderState.style || !builderState.palette || !builderState.wrapping) return;
        
        const builderProduct: Product = {
          id: `builder-${Date.now()}`,
          name: `Собранный букет: ${builderState.style.name}`,
          price: builderState.flowers.reduce((sum: number, f) => sum + f.price, 0) + builderState.wrapping.price,
          image: builderState.style.image,
          category: 'custom',
          description: `Стиль: ${builderState.style.name}, Палитра: ${builderState.palette.name}, Упаковка: ${builderState.wrapping.name}`,
        };
        
        const cartItem: CartItem = {
          id: `cart-${Date.now()}`,
          product: builderProduct,
          quantity: 1,
          customMessage: builderState.message,
        };
        
        await state.addToCart(cartItem);
        state.resetBuilder();
      },
      
      // Orders
      orders: [],
      fetchOrders: async () => {
        try {
          set({ isLoading: true, error: null });
          const { data } = await api.orders.getMyOrders();
          set({ orders: data || [], isLoading: false });
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
        }
      },
      createOrder: async (orderData) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.orders.create(orderData);
          if (response.success && response.data) {
            set((state) => ({
              orders: [response.data!, ...state.orders],
              cart: [], // Clear cart after successful order
              isLoading: false,
            }));
            return response.data;
          }
          set({ isLoading: false });
          return null;
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
          return null;
        }
      },
      cancelOrder: async (orderId: string) => {
        try {
          await api.orders.cancel(orderId);
          set((state) => ({
            orders: state.orders.map((o) => 
              o.id === orderId ? { ...o, status: 'cancelled' as const } : o
            )
          }));
        } catch (e: any) {
          set({ error: e.message });
        }
      },
      
      // User
      user: null,
      setUser: (user: User | null) => set({ user }),
      fetchUser: async () => {
        try {
          const { data } = await api.user.getMe();
          if (data) {
            set((state) => ({
              user: state.user ? { ...state.user, ...data } : {
                id: data.id,
                name: `${data.firstName} ${data.lastName || ''}`.trim(),
                phone: data.phone || '',
                avatar: data.avatar,
                addresses: [],
                favorites: [],
                orders: [],
              } as User
            }));
          }
        } catch (e) {
          // User might not be authenticated yet
        }
      },
      updateUserPhone: async (phone: string) => {
        try {
          await api.user.updatePhone(phone);
          set((state) => ({
            user: state.user ? { ...state.user, phone } : null
          }));
        } catch (e: any) {
          set({ error: e.message });
        }
      },
      
      // Favorites
      fetchFavorites: async () => {
        try {
          const { data } = await api.favorites.getMyFavorites();
          set((state) => ({
            user: state.user ? {
              ...state.user,
              favorites: data || []
            } : null
          }));
        } catch (e) {
          // Silently fail
        }
      },
      addToFavorites: async (productId: string) => {
        set((state) => ({
          user: state.user ? {
            ...state.user,
            favorites: [...state.user.favorites, productId]
          } : null
        }));
        try {
          await api.favorites.add(productId);
        } catch (e) {
          // Revert on failure
          set((state) => ({
            user: state.user ? {
              ...state.user,
              favorites: state.user.favorites.filter((id: string) => id !== productId)
            } : null
          }));
        }
      },
      removeFromFavorites: async (productId: string) => {
        set((state) => ({
          user: state.user ? {
            ...state.user,
            favorites: state.user.favorites.filter((id: string) => id !== productId)
          } : null
        }));
        try {
          await api.favorites.remove(productId);
        } catch (e) {
          // Revert on failure
          set((state) => ({
            user: state.user ? {
              ...state.user,
              favorites: [...state.user.favorites, productId]
            } : null
          }));
        }
      },
      isFavorite: (productId: string) => {
        const state = get();
        return state.user?.favorites.includes(productId) || false;
      },
      
      // Discount Card
      discountCard: null,
      fetchDiscountCard: async () => {
        try {
          const { data } = await api.discountCards.getMyCard();
          set({ discountCard: data || null });
        } catch (e) {
          set({ discountCard: null });
        }
      },
      requestDiscountCard: async (cardNumber: string) => {
        try {
          set({ isLoading: true, error: null });
          const { data } = await api.discountCards.requestCard(cardNumber);
          if (data) {
            set({ discountCard: data });
          }
          set({ isLoading: false });
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
        }
      },
      removeDiscountCard: async () => {
        try {
          await api.discountCards.removeCard();
          set({ discountCard: null });
        } catch (e: any) {
          set({ error: e.message });
        }
      },
      
      // Settings
      settings: null,
      fetchSettings: async () => {
        try {
          const { data } = await api.settings.getAll();
          if (data) {
            set({ settings: data });
          }
        } catch (e) {
          // Use default settings
          set({ 
            settings: {
              deliveryCityPrice: 500,
              deliveryOutskirtsPrice: 800,
              freeDeliveryThreshold: 3000,
              seasonalTheme: 'spring',
              shopName: 'Цветочная лавка',
              shopPhone: '+7 (999) 000-00-00',
              shopAddressCvetochaya: 'ул. Цветочная, 1',
              shopAddressFlorenciya: 'ул. Роз, 15',
              workingHours: '9:00 - 21:00',
            }
          });
        }
      },
      getDeliveryPrice: (isOutskirts: boolean, subtotal: number) => {
        const state = get();
        const settings = state.settings;
        
        if (!settings) {
          return isOutskirts ? 800 : 500;
        }
        
        // Free delivery threshold
        if (subtotal >= settings.freeDeliveryThreshold) {
          return 0;
        }
        
        return isOutskirts ? settings.deliveryOutskirtsPrice : settings.deliveryCityPrice;
      },
      
      // Admin
      isAdmin: false,
      adminRole: null,
      checkAdminStatus: async () => {
        try {
          const { data } = await api.admins.check();
          if (data) {
            set({ 
              isAdmin: data.isAdmin,
              adminRole: data.role as 'admin' | 'florist' | null
            });
          }
        } catch (e) {
          set({ isAdmin: false, adminRole: null });
        }
      },
      
      // Addresses
      addAddress: (address: import('@/types').Address) => set((state) => ({
        user: state.user ? {
          ...state.user,
          addresses: [...state.user.addresses, address]
        } : null
      })),
      removeAddress: (index: number) => set((state) => ({
        user: state.user ? {
          ...state.user,
          addresses: state.user.addresses.filter((_: import('@/types').Address, i: number) => i !== index)
        } : null
      })),
      
      // Filters
      selectedCategory: null,
      setSelectedCategory: (category: string | null) => set({ selectedCategory: category }),
      priceRange: [0, 50000],
      setPriceRange: (range: [number, number]) => set({ priceRange: range }),
      
      // Data Fetching
      fetchProducts: async (category?: string) => {
        try {
          set({ isLoading: true, error: null });
          const { data } = await api.products.getAll(category ? { category } : undefined);
          set({ products: data || [], isLoading: false });
        } catch (e: any) {
          set({ error: e.message || 'Не удалось загрузить каталог', isLoading: false });
        }
      },
      fetchStories: async () => {
        try {
          const { data } = await api.stories.getAll();
          set({ stories: data || [] });
        } catch (e) {
          // Silently fail
        }
      },
      fetchCategories: async () => {
        try {
          const { data } = await api.categories.getAll();
          set({ categories: data || [] });
        } catch (e) {
          // Silently fail
        }
      },
      searchProducts: async (query: string) => {
        try {
          const { data } = await api.products.search(query);
          return data || [];
        } catch (e) {
          return [];
        }
      },
      
      // Initialize
      initialize: async () => {
        const state = get();
        await Promise.allSettled([
          state.fetchCategories(),
          state.fetchProducts(),
          state.fetchStories(),
          state.fetchUser(),
          state.fetchDiscountCard(),
          state.fetchSettings(),
          state.checkAdminStatus(),
          state.syncCart(),
        ]);
      },
    }),
    {
      name: 'cvetochaya-lavka-api-storage',
      partialize: (state) => ({
        cart: state.cart,
        user: state.user,
        builderState: state.builderState,
        selectedCategory: state.selectedCategory,
        priceRange: state.priceRange,
      }),
    }
  )
);

export default useApiStore;
