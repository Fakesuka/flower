export type Role = 'admin' | 'florist';

export type DeliveryType = 'pickup' | 'delivery';

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

export interface AuthUser {
  id: number;
  username: string;
  role: Role;
  store_id: number | null;
}
