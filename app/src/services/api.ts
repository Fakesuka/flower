// API Service for Telegram WebApp Flower Shop
// Handles all communication with the backend

import type { Product, Story, Category, Order, CartItem, DiscountCard } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Get Telegram WebApp initData for authentication
function getTelegramAuthHeader(): string {
  const tg = (window as any).Telegram?.WebApp;
  if (tg) {
    return tg.initData;
  }
  // Fallback for development
  return localStorage.getItem('telegram_init_data') || '';
}

// Generic fetch wrapper with auth
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const authData = getTelegramAuthHeader();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  
  if (authData) {
    headers['X-Telegram-Auth'] = authData;
  }
  
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new Error('Не удалось подключиться к серверу. Проверьте интернет и повторите попытку.');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// ==================== Products API ====================

export interface ProductsFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  isNew?: boolean;
  isBestseller?: boolean;
  search?: string;
}

export const productsApi = {
  // Get all products with optional filters
  getAll: (filters?: ProductsFilter): Promise<{ success: boolean; data: Product[] }> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters?.isNew) params.append('isNew', 'true');
    if (filters?.isBestseller) params.append('isBestseller', 'true');
    if (filters?.search) params.append('search', filters.search);
    
    return apiFetch(`/products?${params.toString()}`);
  },
  
  // Get single product
  getById: (id: string): Promise<{ success: boolean; data: Product }> => {
    return apiFetch(`/products/${id}`);
  },
  
  // Get products by category
  getByCategory: (categoryId: string): Promise<{ success: boolean; data: Product[] }> => {
    return apiFetch(`/products/category/${categoryId}`);
  },
  
  // Get bestsellers
  getBestsellers: (): Promise<{ success: boolean; data: Product[] }> => {
    return apiFetch('/products/bestsellers/all');
  },
  
  // Get new arrivals
  getNewArrivals: (): Promise<{ success: boolean; data: Product[] }> => {
    return apiFetch('/products/new/all');
  },
  
  // Search products
  search: (query: string): Promise<{ success: boolean; data: Product[] }> => {
    return apiFetch(`/products/search?q=${encodeURIComponent(query)}`);
  },
};

// ==================== Stories API ====================

export const storiesApi = {
  // Get all stories
  getAll: (): Promise<{ success: boolean; data: Story[] }> => {
    return apiFetch('/stories');
  },
  
  // Get single story
  getById: (id: string): Promise<{ success: boolean; data: Story }> => {
    return apiFetch(`/stories/${id}`);
  },
};

// ==================== Categories API ====================

export const categoriesApi = {
  // Get all categories
  getAll: (): Promise<{ success: boolean; data: Category[] }> => {
    return apiFetch('/categories');
  },
  
  // Get single category
  getById: (id: string): Promise<{ success: boolean; data: Category }> => {
    return apiFetch(`/categories/${id}`);
  },
};

// ==================== Discount Cards API ====================

export interface DiscountCardRequest {
  cardNumber: string;
}

export interface DiscountCardResponse {
  success: boolean;
  data?: DiscountCard;
  error?: string;
}

export const discountCardsApi = {
  // Get user's discount card
  getMyCard: (): Promise<DiscountCardResponse> => {
    return apiFetch('/discount-cards/my');
  },
  
  // Request new discount card
  requestCard: (cardNumber: string): Promise<DiscountCardResponse> => {
    return apiFetch('/discount-cards/request', {
      method: 'POST',
      body: JSON.stringify({ cardNumber }),
    });
  },
  
  // Remove discount card
  removeCard: (): Promise<{ success: boolean }> => {
    return apiFetch('/discount-cards/my', {
      method: 'DELETE',
    });
  },
  
  // Admin: Get all pending cards
  getPending: (): Promise<{ success: boolean; data: DiscountCard[] }> => {
    return apiFetch('/discount-cards/pending');
  },
  
  // Admin: Get all cards
  getAll: (): Promise<{ success: boolean; data: DiscountCard[] }> => {
    return apiFetch('/discount-cards');
  },
  
  // Admin: Approve card
  approve: (cardId: string, discountPercent: number): Promise<DiscountCardResponse> => {
    return apiFetch(`/discount-cards/${cardId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ discountPercent }),
    });
  },
  
  // Admin: Reject card
  reject: (cardId: string): Promise<DiscountCardResponse> => {
    return apiFetch(`/discount-cards/${cardId}/reject`, {
      method: 'POST',
    });
  },
};

// ==================== Orders API ====================

export interface CreateOrderRequest {
  items: CartItem[];
  address: {
    city: string;
    street: string;
    house: string;
    apartment?: string;
    entrance?: string;
    floor?: string;
    comment?: string;
  };
  recipient: {
    name: string;
    phone: string;
  };
  paymentMethod: 'stars' | 'card' | 'cash';
  deliveryDate: string;
  deliveryTime?: string;
  discountCardId?: string;
  storeLocation?: 'cvetochaya_lavka' | 'florenciya';
  paymentUrl?: string;
}

export const ordersApi = {
  // Get user's orders
  getMyOrders: (): Promise<{ success: boolean; data: Order[] }> => {
    return apiFetch('/orders/my');
  },
  
  // Get single order
  getById: (orderId: string): Promise<{ success: boolean; data: Order }> => {
    return apiFetch(`/orders/${orderId}`);
  },
  
  // Create new order
  create: (orderData: CreateOrderRequest): Promise<{ success: boolean; data: Order; error?: string }> => {
    return apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },
  
  // Cancel order
  cancel: (orderId: string): Promise<{ success: boolean }> => {
    return apiFetch(`/orders/${orderId}/cancel`, {
      method: 'POST',
    });
  },
  
  // Admin: Get all orders
  getAll: (): Promise<{ success: boolean; data: Order[] }> => {
    return apiFetch('/orders');
  },
  
  // Admin: Update order status
  updateStatus: (orderId: string, status: string): Promise<{ success: boolean }> => {
    return apiFetch(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

// ==================== Favorites API ====================

export const favoritesApi = {
  // Get user's favorites
  getMyFavorites: (): Promise<{ success: boolean; data: string[] }> => {
    return apiFetch('/favorites/my');
  },
  
  // Add to favorites
  add: (productId: string): Promise<{ success: boolean }> => {
    return apiFetch('/favorites', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  },
  
  // Remove from favorites
  remove: (productId: string): Promise<{ success: boolean }> => {
    return apiFetch(`/favorites/${productId}`, {
      method: 'DELETE',
    });
  },
  
  // Toggle favorite
  toggle: async (productId: string, isFavorite: boolean): Promise<{ success: boolean }> => {
    if (isFavorite) {
      return favoritesApi.remove(productId);
    } else {
      return favoritesApi.add(productId);
    }
  },
};

// ==================== Cart API ====================

export interface CartItemRequest {
  productId: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  customMessage?: string;
}

export const cartApi = {
  // Get user's cart
  getMyCart: (): Promise<{ success: boolean; data: CartItem[] }> => {
    return apiFetch('/cart/my');
  },
  
  // Add item to cart
  addItem: (item: CartItemRequest): Promise<{ success: boolean }> => {
    return apiFetch('/cart', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },
  
  // Update cart item
  updateItem: (itemId: string, updates: Partial<CartItemRequest>): Promise<{ success: boolean }> => {
    return apiFetch(`/cart/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  
  // Remove item from cart
  removeItem: (itemId: string): Promise<{ success: boolean }> => {
    return apiFetch(`/cart/${itemId}`, {
      method: 'DELETE',
    });
  },
  
  // Clear cart
  clear: (): Promise<{ success: boolean }> => {
    return apiFetch('/cart/my', {
      method: 'DELETE',
    });
  },
  
  // Sync local cart with server
  sync: (items: CartItemRequest[]): Promise<{ success: boolean }> => {
    return apiFetch('/cart/sync', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },
};

// ==================== User API ====================

export interface UserProfile {
  id: string;
  firstName: string;
  lastName?: string;
  username?: string;
  phone?: string;
  avatar?: string;
}

export const userApi = {
  // Get current user profile
  getMe: (): Promise<{ success: boolean; data: UserProfile }> => {
    return apiFetch('/users/me');
  },
  
  // Update user profile
  updateProfile: (data: Partial<UserProfile>): Promise<{ success: boolean; data: UserProfile }> => {
    return apiFetch('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  // Update phone number
  updatePhone: (phone: string): Promise<{ success: boolean }> => {
    return apiFetch('/users/phone', {
      method: 'PUT',
      body: JSON.stringify({ phone }),
    });
  },
};

// ==================== Settings API ====================

export interface AppSettings {
  deliveryCityPrice: number;
  deliveryOutskirtsPrice: number;
  freeDeliveryThreshold: number;
  seasonalTheme: 'winter' | 'spring' | 'summer' | 'autumn';
  shopName: string;
  shopPhone: string;
  shopAddressCvetochaya: string;
  shopAddressFlorenciya: string;
  workingHours: string;
}

export const settingsApi = {
  // Get all settings
  getAll: (): Promise<{ success: boolean; data: AppSettings }> => {
    return apiFetch('/settings');
  },
  
  // Get specific setting
  get: (key: string): Promise<{ success: boolean; data: { key: string; value: string | null } }> => {
    return apiFetch(`/settings/${key}`);
  },
  
  // Update settings (admin only)
  update: (settings: Partial<AppSettings>): Promise<{ success: boolean; data: AppSettings }> => {
    return apiFetch('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
  
  // Update single setting (admin only)
  updateOne: (key: string, value: string): Promise<{ success: boolean }> => {
    return apiFetch(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  },
};

// ==================== Admin API ====================

export interface Admin {
  id: number;
  telegram_id: string;
  name?: string;
  role: 'admin' | 'florist';
  created_at: string;
}

export const adminsApi = {
  // Check if current user is admin
  check: (): Promise<{ success: boolean; data: { isAdmin: boolean; role: string | null } }> => {
    return apiFetch('/admins/check');
  },
  
  // Get all admins (admin only)
  getAll: (): Promise<{ success: boolean; data: Admin[] }> => {
    return apiFetch('/admins');
  },
  
  // Add new admin (admin only)
  add: (telegramId: string, name?: string, role?: 'admin' | 'florist'): Promise<{ success: boolean }> => {
    return apiFetch('/admins', {
      method: 'POST',
      body: JSON.stringify({ telegramId, name, role }),
    });
  },
  
  // Update admin role (admin only)
  updateRole: (telegramId: string, role: 'admin' | 'florist'): Promise<{ success: boolean }> => {
    return apiFetch(`/admins/${telegramId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },
  
  // Remove admin (admin only)
  remove: (telegramId: string): Promise<{ success: boolean }> => {
    return apiFetch(`/admins/${telegramId}`, {
      method: 'DELETE',
    });
  },
};

// ==================== Health Check ====================

export const healthApi = {
  check: (): Promise<{ success: boolean; message: string; timestamp: string }> => {
    return apiFetch('/health');
  },
};

// Export all APIs
export const api = {
  products: productsApi,
  stories: storiesApi,
  categories: categoriesApi,
  discountCards: discountCardsApi,
  orders: ordersApi,
  favorites: favoritesApi,
  cart: cartApi,
  user: userApi,
  settings: settingsApi,
  admins: adminsApi,
  health: healthApi,
};

export default api;
