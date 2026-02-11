export type Role = 'admin' | 'florist';

export interface StaffUser {
  id: number;
  username: string;
  role: Role;
  store_id: number | null;
}

export interface Store {
  id: number;
  name: string;
  address?: string;
  is_active: number;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  image?: string;
}

export interface Story {
  id: number;
  title: string;
  image?: string;
}

export type OrderStatus =
  | 'NEW'
  | 'ACCEPTED'
  | 'NEED_CUSTOMER_CONFIRMATION'
  | 'PAYMENT_LINK_SENT'
  | 'PAID'
  | 'IN_PROGRESS'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'COMPLETED'
  | 'CANCELED';

export interface Order {
  id: number;
  delivery_type: 'pickup' | 'delivery';
  pickup_store_id: number | null;
  assigned_store_id: number | null;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  customer_comment?: string;
  items_json: string;
  total_price: number;
  payment_link?: string;
}
