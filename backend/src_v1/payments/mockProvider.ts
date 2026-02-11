import type { CreatePaymentInput, CreatePaymentResult, PaymentProvider, ProviderWebhookResult } from './provider';

export class MockPaymentProvider implements PaymentProvider {
  name = 'mock' as const;

  constructor(private readonly apiBaseUrl: string) {}

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    return {
      externalId: `mock-ext-${input.paymentId}`,
      paymentUrl: `${this.apiBaseUrl}/pay/mock/${input.paymentId}`,
      status: 'PENDING',
    };
  }

  async parseWebhook(payload: unknown): Promise<ProviderWebhookResult> {
    const data = payload as { paymentId?: number; status?: ProviderWebhookResult['status'] };
    if (!data.paymentId || !data.status) {
      throw new Error('Invalid mock webhook payload');
    }
    return { paymentId: Number(data.paymentId), status: data.status };
  }
}
