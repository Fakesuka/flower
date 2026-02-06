// Product Types
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: string;
  description: string;
  composition?: string[];
  sizes?: SizeOption[];
  colors?: ColorOption[];
  isNew?: boolean;
  isBestseller?: boolean;
}

export interface SizeOption {
  id: string;
  label: string;
  name: string;
  priceModifier: number;
  description?: string;
}

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
}

// Story Types
export interface Story {
  id: string;
  image: string;
  title: string;
  isNew?: boolean;
}

// Discount Card Types
export type DiscountCardStatus = 'pending' | 'approved' | 'rejected';

export interface DiscountCard {
  id: string;
  number: string;
  discountPercent: number;
  status: DiscountCardStatus;
  createdAt: string;
  approvedAt?: string;
}

// Cart Types
export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedSize?: SizeOption;
  selectedColor?: ColorOption;
  customMessage?: string;
}

// Builder Types
export interface BuilderStep {
  id: number;
  title: string;
  description: string;
}

export interface BuilderStyle {
  id: string;
  name: string;
  description: string;
  image: string;
}

export interface BuilderFlower {
  id: string;
  name: string;
  image: string;
  price: number;
}

export interface BuilderPalette {
  id: string;
  name: string;
  colors: string[];
}

export interface BuilderWrapping {
  id: string;
  name: string;
  image: string;
  price: number;
}

export interface BuilderState {
  style?: BuilderStyle;
  flowers: BuilderFlower[];
  palette?: BuilderPalette;
  wrapping?: BuilderWrapping;
  message: string;
  messagePreset?: string;
}

// Order Types
export interface Order {
  id: string;
  items: CartItem[];
  status: OrderStatus;
  total: number;
  deliveryDate: string;
  deliveryTime?: string;
  address: Address;
  recipient: Recipient;
  paymentMethod: PaymentMethod;
  createdAt: string;
  discountCardId?: string;
  discountAmount?: number;
}

export type OrderStatus = 
  | 'pending' 
  | 'accepted' 
  | 'preparing' 
  | 'delivering' 
  | 'delivered' 
  | 'cancelled';

export interface Address {
  city: string;
  street: string;
  house: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
  comment?: string;
}

export interface Recipient {
  name: string;
  phone: string;
}

export type PaymentMethod = 'stars' | 'card' | 'cash';

// User Types
export interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  addresses: Address[];
  favorites: string[];
  orders: Order[];
  discountCard?: DiscountCard;
}

// Navigation
export type Screen = 
  | 'home' 
  | 'catalog' 
  | 'product' 
  | 'builder' 
  | 'cart' 
  | 'checkout' 
  | 'profile' 
  | 'orders' 
  | 'addresses' 
  | 'favorites'
  | 'admin';

// Category
export interface Category {
  id: string;
  name: string;
  icon: string;
  image?: string;
}
