import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types/api';

export interface CartItem {
  product: Product;
  qty: number;
}

interface ClientState {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  updateQty: (productId: number, qty: number) => void;
  clearCart: () => void;
}

export const useClientStore = create<ClientState>()(
  persist(
    (set) => ({
      cart: [],
      addToCart: (product) =>
        set((state) => {
          const existing = state.cart.find((i) => i.product.id === product.id);
          if (existing) {
            return { cart: state.cart.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)) };
          }
          return { cart: [...state.cart, { product, qty: 1 }] };
        }),
      updateQty: (productId, qty) =>
        set((state) => ({
          cart: state.cart
            .map((i) => (i.product.id === productId ? { ...i, qty } : i))
            .filter((i) => i.qty > 0),
        })),
      clearCart: () => set({ cart: [] }),
    }),
    { name: 'client-cart' }
  )
);
