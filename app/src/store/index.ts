import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Product, 
  CartItem, 
  BuilderState, 
  Order, 
  User, 
  Screen
} from '@/types';

interface AppState {
  // Navigation
  currentScreen: Screen;
  previousScreen: Screen | null;
  navigateTo: (screen: Screen) => void;
  goBack: () => void;
  
  // Selected Product
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  
  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  getCartTotalWithDiscount: () => { subtotal: number; discount: number; total: number };
  
  // Builder
  builderState: BuilderState;
  updateBuilderState: (updates: Partial<BuilderState>) => void;
  resetBuilder: () => void;
  addBuilderToCart: () => void;
  
  // Orders
  orders: Order[];
  addOrder: (order: Order) => void;
  
  // User
  user: User | null;
  setUser: (user: User | null) => void;
  addToFavorites: (productId: string) => void;
  removeFromFavorites: (productId: string) => void;
  addAddress: (address: import('@/types').Address) => void;
  removeAddress: (index: number) => void;
  
  // Discount Card
  requestDiscountCard: (cardNumber: string) => void;
  approveDiscountCard: (discountPercent: number) => void;
  rejectDiscountCard: () => void;
  removeDiscountCard: () => void;
  
  // Filters
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
}

const initialBuilderState: BuilderState = {
  style: undefined,
  flowers: [],
  palette: undefined,
  wrapping: undefined,
  message: '',
  messagePreset: undefined,
};

export const useAppStore = create<AppState>()(
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
      
      // Selected Product
      selectedProduct: null,
      setSelectedProduct: (product: Product | null) => set({ selectedProduct: product }),
      
      // Cart
      cart: [],
      addToCart: (item: CartItem) => set((state) => ({
        cart: [...state.cart, item]
      })),
      removeFromCart: (itemId: string) => set((state) => ({
        cart: state.cart.filter((item: CartItem) => item.id !== itemId)
      })),
      updateQuantity: (itemId: string, quantity: number) => set((state) => ({
        cart: quantity <= 0 
          ? state.cart.filter((item: CartItem) => item.id !== itemId)
          : state.cart.map((item: CartItem) => 
              item.id === itemId ? { ...item, quantity } : item
            )
      })),
      clearCart: () => set({ cart: [] }),
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
        const card = state.user?.discountCard;
        
        if (card?.status === 'approved') {
          const discount = Math.round(subtotal * (card.discountPercent / 100));
          return { subtotal, discount, total: subtotal - discount };
        }
        
        return { subtotal, discount: 0, total: subtotal };
      },
      
      // Builder
      builderState: initialBuilderState,
      updateBuilderState: (updates: Partial<BuilderState>) => set((state) => ({
        builderState: { ...state.builderState, ...updates }
      })),
      resetBuilder: () => set({ builderState: initialBuilderState }),
      addBuilderToCart: () => {
        const state = get();
        const { builderState } = state;
        
        if (!builderState.style || !builderState.palette || !builderState.wrapping) return;
        
        const builderProduct: Product = {
          id: `builder-${Date.now()}`,
          name: `Собранный букет: ${builderState.style.name}`,
          price: builderState.flowers.reduce((sum: number, f: import('@/types').BuilderFlower) => sum + f.price, 0) + builderState.wrapping.price,
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
        
        state.addToCart(cartItem);
        state.resetBuilder();
      },
      
      // Orders
      orders: [],
      addOrder: (order: Order) => set((state) => ({
        orders: [order, ...state.orders]
      })),
      
      // User
      user: null,
      setUser: (user: User | null) => set({ user }),
      addToFavorites: (productId: string) => set((state) => ({
        user: state.user ? {
          ...state.user,
          favorites: [...state.user.favorites, productId]
        } : null
      })),
      removeFromFavorites: (productId: string) => set((state) => ({
        user: state.user ? {
          ...state.user,
          favorites: state.user.favorites.filter((id: string) => id !== productId)
        } : null
      })),
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
      
      // Discount Card
      requestDiscountCard: (cardNumber: string) => set((state) => ({
        user: state.user ? {
          ...state.user,
          discountCard: {
            id: `card-${Date.now()}`,
            number: cardNumber,
            discountPercent: 0,
            status: 'pending',
            createdAt: new Date().toISOString(),
          }
        } : null
      })),
      approveDiscountCard: (discountPercent: number) => set((state) => ({
        user: state.user ? {
          ...state.user,
          discountCard: state.user.discountCard ? {
            ...state.user.discountCard,
            discountPercent,
            status: 'approved',
            approvedAt: new Date().toISOString(),
          } : undefined
        } : null
      })),
      rejectDiscountCard: () => set((state) => ({
        user: state.user ? {
          ...state.user,
          discountCard: state.user.discountCard ? {
            ...state.user.discountCard,
            status: 'rejected',
          } : undefined
        } : null
      })),
      removeDiscountCard: () => set((state) => ({
        user: state.user ? {
          ...state.user,
          discountCard: undefined
        } : null
      })),
      
      // Filters
      selectedCategory: null,
      setSelectedCategory: (category: string | null) => set({ selectedCategory: category }),
      priceRange: [0, 50000],
      setPriceRange: (range: [number, number]) => set({ priceRange: range }),
    }),
    {
      name: 'cvetochaya-lavka-storage',
      partialize: (state) => ({
        cart: state.cart,
        orders: state.orders,
        user: state.user,
        builderState: state.builderState,
      }),
    }
  )
);
