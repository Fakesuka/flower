export type PaymentProviderName = 'mock';

export interface CreatePaymentInput {
  paymentId: number;
  orderId: number;
  amount: number;
  currency: string;
}

export interface CreatePaymentResult {
  externalId: string;
  paymentUrl: string;
  status: 'PENDING' | 'CREATED';
}

export interface ProviderWebhookResult {
  paymentId: number;
  status: 'PAID' | 'FAILED' | 'CANCELED' | 'PENDING';
}

export interface PaymentProvider {
  name: PaymentProviderName;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  parseWebhook(payload: unknown): Promise<ProviderWebhookResult>;
}
