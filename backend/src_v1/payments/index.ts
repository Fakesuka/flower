import { MockPaymentProvider } from './mockProvider';
import type { PaymentProvider, PaymentProviderName } from './provider';

export function getPaymentProvider(provider: PaymentProviderName, apiBaseUrl: string): PaymentProvider {
  if (provider === 'mock') return new MockPaymentProvider(apiBaseUrl);
  throw new Error(`Unsupported provider: ${provider}`);
}
