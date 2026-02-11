import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export const storeSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const userCreateSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(['admin', 'florist']),
  store_id: z.number().int().positive().nullable().optional(),
});

export const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().nonnegative(),
  image: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const storySchema = z.object({
  title: z.string().min(1),
  image: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const orderItemSchema = z.object({
  product_id: z.number().int().positive(),
  qty: z.number().int().positive(),
  price: z.number().int().nonnegative(),
  name: z.string().min(1),
});

export const createOrderSchema = z.object({
  delivery_type: z.enum(['pickup', 'delivery']),
  pickup_store_id: z.number().int().positive().nullable().optional(),
  customer_name: z.string().min(1),
  customer_phone: z.string().min(5),
  customer_comment: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
  total_price: z.number().int().nonnegative(),
});

export const updateStatusSchema = z.object({
  status: z.enum([
    'NEW',
    'ACCEPTED',
    'NEED_CUSTOMER_CONFIRMATION',
    'PAYMENT_LINK_SENT',
    'PAID',
    'IN_PROGRESS',
    'READY',
    'OUT_FOR_DELIVERY',
    'COMPLETED',
    'CANCELED',
  ]),
  message: z.string().optional(),
});

export const eventSchema = z.object({
  event_type: z.enum(['COMMENT', 'STATUS_CHANGE', 'CONTACT_ATTEMPT']),
  message: z.string().min(1),
});
