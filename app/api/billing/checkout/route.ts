import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getStripe,
  getStripePriceId,
  isStripePriceConfigured,
  isBillingInterval,
  isPaidPlan,
  type BillingInterval,
  type PaidPlan,
} from '@/lib/stripe';

type CheckoutBody = {
  siteId?: string;
  plan?: string;
  billing?: string;
};

function getBaseUrl(request: NextRequest): string {
  const origin = request.headers.get('origin');
  if (origin) return origin;

  const host = request.headers.get('host');
  if (host) {
    const protocol = host.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sitespresso.com';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as CheckoutBody;
    const siteId = body.siteId;
    const requestedPlan = body.plan ?? 'starter';
    const requestedBilling = body.billing ?? 'monthly';

    if (!isPaidPlan(requestedPlan)) {
      return NextResponse.json({ error: 'Invalid billing plan.' }, { status: 400 });
    }

    if (!isBillingInterval(requestedBilling)) {
      return NextResponse.json({ error: 'Invalid billing interval.' }, { status: 400 });
    }

    if (!isStripePriceConfigured(requestedPlan, requestedBilling)) {
      return NextResponse.json(
        { error: `${requestedPlan} ${requestedBilling} billing is not configured yet.` },
        { status: 400 },
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    const stripe = getStripe();
    const priceId = getStripePriceId(requestedPlan as PaidPlan, requestedBilling as BillingInterval);

    let stripeCustomerId = profile.stripe_customer_id as string | null;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: { user_id: user.id },
      });
      stripeCustomerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id);
    }

    const baseUrl = getBaseUrl(request);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?billing=success`,
      cancel_url: `${baseUrl}/dashboard?billing=cancelled`,
      metadata: {
        user_id: user.id,
        site_id: siteId ?? '',
        plan: requestedPlan,
        billing: requestedBilling,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          site_id: siteId ?? '',
          plan: requestedPlan,
          billing: requestedBilling,
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session.' },
      { status: 500 },
    );
  }
}
