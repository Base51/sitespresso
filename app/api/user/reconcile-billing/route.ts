import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe, planFromPriceId } from '@/lib/stripe';
import { normalizePlan, type Plan } from '@/lib/billing/plans';

export const runtime = 'nodejs';

type Upsertable = {
  upsert: (values: Record<string, unknown>, options?: { onConflict?: string }) => Promise<unknown>;
};

type Updatable = {
  update: (values: Record<string, unknown>) => {
    eq: (column: string, value: string) => Promise<unknown>;
  };
};

type StripeSubscriptionShape = {
  id: string;
  status: string;
  items: {
    data: Array<{
      price?: { id?: string | null } | null;
      current_period_start?: number | null;
      current_period_end?: number | null;
    }>;
  };
  metadata?: Record<string, string>;
  cancel_at_period_end?: boolean;
  created: number;
};

function resolvePlanFromStripeSubscription(subscription: StripeSubscriptionShape): Plan {
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const mappedPlan = planFromPriceId(priceId);
  if (mappedPlan !== 'free') {
    return mappedPlan;
  }

  const metadataPlan = normalizePlan(subscription.metadata?.plan);
  if (metadataPlan !== 'free') {
    return metadataPlan;
  }

  return 'free';
}

export async function POST(): Promise<NextResponse> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, stripe_customer_id')
      .eq('id', user.id)
      .single();

    const currentPlan = normalizePlan(profile?.plan);
    const stripeCustomerId = (profile?.stripe_customer_id as string | null | undefined) ?? null;

    if (!stripeCustomerId) {
      return NextResponse.json({ success: true, changed: false, plan: currentPlan, reason: 'no_customer' });
    }

    const stripe = getStripe();
    const list = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all',
      limit: 20,
    });

    const activeLike = list.data.filter((subscription) =>
      ['active', 'trialing', 'past_due', 'unpaid'].includes(subscription.status)
    );

    const latest = activeLike.sort((a, b) => {
      const aEnd = a.items.data[0]?.current_period_end ?? 0;
      const bEnd = b.items.data[0]?.current_period_end ?? 0;
      if (aEnd !== bEnd) return bEnd - aEnd;
      return b.created - a.created;
    })[0] as StripeSubscriptionShape | undefined;

    const nextPlan = latest ? resolvePlanFromStripeSubscription(latest) : 'free';
    const changed = nextPlan !== currentPlan;

    const admin = createAdminClient();

    if (latest) {
      const priceId = latest.items.data[0]?.price?.id;
      if (priceId) {
        const subscriptionsTable = admin.from('subscriptions') as unknown as Upsertable;
        await subscriptionsTable.upsert(
            {
              user_id: user.id,
              stripe_subscription_id: latest.id,
              stripe_price_id: priceId,
              status: latest.status,
              current_period_start: latest.items.data[0]?.current_period_start
                ? new Date((latest.items.data[0]?.current_period_start as number) * 1000).toISOString()
                : null,
              current_period_end: latest.items.data[0]?.current_period_end
                ? new Date((latest.items.data[0]?.current_period_end as number) * 1000).toISOString()
                : null,
              cancel_at_period_end: Boolean(latest.cancel_at_period_end),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'stripe_subscription_id' }
          );
      }
    }

    if (changed) {
      console.log(`[reconcile-billing] Updating profile plan: ${currentPlan} → ${nextPlan} (user: ${user.id})`);
      await (admin.from('profiles') as unknown as Updatable)
        .update({ plan: nextPlan, stripe_customer_id: stripeCustomerId })
        .eq('id', user.id);
    }

    return NextResponse.json({ 
      success: true, 
      changed, 
      plan: nextPlan,
      debug: {
        currentPlan,
        nextPlan,
        stripeCustomerId,
        subscriptionCount: activeLike.length,
        latestSubscription: latest ? {
          status: latest.status,
          priceId: latest.items.data[0]?.price?.id,
        } : null,
      }
    });
  } catch (error) {
    console.error('Billing reconciliation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reconcile billing.' },
      { status: 500 }
    );
  }
}
