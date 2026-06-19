import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe, getWebhookSecret, planFromStripeStatus } from '@/lib/stripe';

export const runtime = 'nodejs';

type Upsertable = {
  upsert: (values: Record<string, unknown>, options?: { onConflict?: string }) => Promise<unknown>;
};

type Updatable = {
  update: (values: Record<string, unknown>) => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => Promise<unknown>;
    };
  };
};

async function upsertSubscriptionFromStripe(
  subscription: Stripe.Subscription,
): Promise<void> {
  const admin = createAdminClient();

  const userId =
    (subscription.metadata.user_id as string | undefined) ||
    (subscription.customer as string | undefined);

  // If metadata isn't present, map by customer id from profiles.
  let resolvedUserId: string | null = null;
  if (userId && userId.startsWith('cus_')) {
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', userId)
      .single();
    resolvedUserId = (profile as { id?: string } | null)?.id ?? null;
  } else {
    resolvedUserId = userId ?? null;
  }

  if (!resolvedUserId) {
    throw new Error(`Could not resolve user for subscription ${subscription.id}.`);
  }

  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) {
    throw new Error(`Subscription ${subscription.id} has no price.`);
  }

  const currentPeriodStart = subscription.items.data[0]?.current_period_start;
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end;

  const subscriptionsTable = admin.from('subscriptions') as unknown as Upsertable;
  await subscriptionsTable.upsert(
      {
        user_id: resolvedUserId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        status: subscription.status,
        current_period_start: currentPeriodStart
          ? new Date(currentPeriodStart * 1000).toISOString()
          : null,
        current_period_end: currentPeriodEnd
          ? new Date(currentPeriodEnd * 1000).toISOString()
          : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'stripe_subscription_id' },
    );

  const nextPlan = planFromStripeStatus(subscription.status);

  await (admin.from('profiles') as unknown as Updatable)
    .update({
      plan: nextPlan,
      stripe_customer_id:
        typeof subscription.customer === 'string' ? subscription.customer : null,
    })
    .eq('id', resolvedUserId);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const stripe = getStripe();
  const admin = createAdminClient();

  if (!session.subscription || typeof session.subscription !== 'string') {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  await upsertSubscriptionFromStripe(subscription);

  const siteId = session.metadata?.site_id;
  const userId = session.metadata?.user_id;

  if (siteId && userId) {
    await (admin.from('sites') as unknown as Updatable)
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', siteId)
      .eq('user_id', userId);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const admin = createAdminClient();
  await upsertSubscriptionFromStripe(subscription);

  let userId = subscription.metadata.user_id as string | undefined;
  if (!userId && typeof subscription.customer === 'string') {
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', subscription.customer)
      .single();
    userId = (profile as { id?: string } | null)?.id;
  }

  if (!userId) return;

  await (admin.from('profiles') as unknown as Updatable)
    .update({ plan: 'free' })
    .eq('id', userId);

  await (admin.from('sites') as unknown as Updatable)
    .update({ status: 'draft' })
    .eq('user_id', userId)
    .eq('status', 'published');
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 });
    }

    const body = await request.text();
    const stripe = getStripe();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, getWebhookSecret());
    } catch (error) {
      return NextResponse.json(
        { error: `Invalid webhook signature: ${(error as Error).message}` },
        { status: 400 },
      );
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await upsertSubscriptionFromStripe(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook handler error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook handling failed.' },
      { status: 500 },
    );
  }
}