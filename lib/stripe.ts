import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured.');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }

  return stripeClient;
}

export function getStripeStarterPriceId(): string {
  const priceId = process.env.STRIPE_STARTER_PRICE_ID;
  if (!priceId) {
    throw new Error('STRIPE_STARTER_PRICE_ID is not configured.');
  }
  return priceId;
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured.');
  }
  return secret;
}

export function planFromStripeStatus(status: string): 'free' | 'starter' {
  return status === 'active' || status === 'trialing' ? 'starter' : 'free';
}
